/*
 * ELASTICSEARCH CONFIDENTIAL
 *
 * Copyright (c) 2017 Elasticsearch BV. All Rights Reserved.
 *
 * Notice: this software, and all information contained
 * therein, is the exclusive property of Elasticsearch BV
 * and its licensors, if any, and is protected under applicable
 * domestic and foreign law, and international treaties.
 *
 * Reproduction, republication or distribution without the
 * express written consent of Elasticsearch BV is
 * strictly prohibited.
 */

import fs from 'fs';

const ML_DIR = 'ml';
const KIBANA_DIR = 'kibana';

export class DataRecognizer {
  constructor(callWithRequest) {
    this.callWithRequest = callWithRequest;
    this.configDir = `${__dirname}/configs`;
    this.savedObjectsClient = null;
  }

  // list all directories under the given directory
  async listDirs(dirName) {
    const dirs = [];
    return new Promise((resolve, reject) => {
      fs.readdir(dirName, (err, fileNames) => {
        if (err) {
          reject(err);
        }
        fileNames.forEach((fileName) => {
          const path = `${dirName}/${fileName}`;
          if (fs.lstatSync(path).isDirectory()) {
            dirs.push(fileName);
          }
        });
        resolve(dirs);
      });
    });
  }

  async readFile(fileName) {
    return new Promise((resolve, reject) => {
      fs.readFile(fileName, 'utf-8', (err, content) => {
        if (err) {
          reject(err);
        } else {
          resolve(content);
        }
      });
    });
  }

  async loadConfigs() {
    const configs = [];
    const dirs = await this.listDirs(this.configDir);
    await Promise.all(dirs.map(async (dir) => {
      const file = await this.readFile(`${this.configDir}/${dir}/index.json`);
      configs.push({
        dirName: dir,
        json: JSON.parse(file)
      });
    }));

    return configs;
  }

  // called externally by an endpoint
  async findMatches(indexPattern) {
    const configs = await this.loadConfigs();
    const results = [];

    await Promise.all(configs.map(async (c) => {
      const config = c.json;
      const match = await this.searchForFields(config, indexPattern);
      if (match) {
        let logo = null;
        if (config.logoFile) {
          try {
            logo = await this.readFile(`${this.configDir}/${c.dirName}/${config.logoFile}`);
            logo = JSON.parse(logo);
          } catch(e) {
            logo = null;
          }
        }
        results.push({
          id: config.id,
          title: config.title,
          query: config.query,
          logo
        });
      }
    }));

    return results;
  }

  async searchForFields(config, indexPattern) {
    const index = indexPattern;
    const size = 0;
    const body = {
      query: config.query
    };

    const resp = await this.callWithRequest('search', { index, size, body });
    return (resp.hits.total !== 0);
  }

  // called externally by an endpoint
  async getConfigs(id) {
    let indexJSON = null;
    let dirName = null;
    const configs = await this.loadConfigs();

    const results = configs.filter(c => c.json.id === id);
    if (results.length) {
      indexJSON = results[0].json;
      dirName = results[0].dirName;
    }
    else {
      // should throw an error here.
      // needs to trigger a 404
      return;
    }

    const jobs = [];
    const datafeeds = [];
    const kibana = {};
    // load all of the job configs
    await Promise.all(indexJSON.jobs.map(async (job) => {
      const jobConfig = await this.readFile(`${this.configDir}/${dirName}/${ML_DIR}/${job.file}`);
      // use the file name for the id
      const jobId = job.file.replace('.json', '');
      jobs.push({
        id: jobId,
        config: JSON.parse(jobConfig)
      });
    }));

    // load all of the datafeed configs
    await Promise.all(indexJSON.datafeeds.map(async (datafeed) => {
      const datafeedConfig = await this.readFile(`${this.configDir}/${dirName}/${ML_DIR}/${datafeed.file}`);
      const datafeedId = datafeed.file.replace('.json', '');
      // use the file name, minus "datafeed_" for the id
      const jobId = datafeedId.replace(/^datafeed_/, '');
      const config = JSON.parse(datafeedConfig);
      config.job_id = jobId;

      datafeeds.push({
        id: datafeedId,
        config
      });
    }));

    // load all of the kibana saved objects
    const kkeys = Object.keys(indexJSON.kibana);
    await Promise.all(kkeys.map(async (key) => {
      kibana[key] = [];
      await Promise.all(indexJSON.kibana[key].map(async (obj) => {
        const kConfig = await this.readFile(`${this.configDir}/${dirName}/${KIBANA_DIR}/${key}/${obj.file}`);
        // use the file name for the id
        const kId = obj.file.replace('.json', '');
        const config = JSON.parse(kConfig);
        kibana[key].push({
          id: kId,
          title: config.title,
          config
        });
      }));
    }));

    return {
      jobs,
      datafeeds,
      kibana
    };
  }

  // called externally by an endpoint
  // takes a config id, an optional jobPrefix and the request object
  // creates all of the jobs, datafeeds and savedObjects  listed in the config.
  // if any of the savedObjects already exist, they will not be overwritten.
  async saveDataRecognizerConfig(configId, jobPrefix, request) {
    this.savedObjectsClient = request.getSavedObjectsClient();
    this.indexPatterns = await this.loadIndexPatterns();

    jobPrefix = (jobPrefix === undefined) ? '' : jobPrefix;
    // load the config from disk
    const config = await this.getConfigs(configId);
    // create an empty results object
    const results = this.createResultsTemplate(config, jobPrefix);
    const saveResults = {
      jobs: [],
      datafeeds: [],
      savedObjects: []
    };
    this.updateJobUrls(config);

    // create the jobs
    if (config.jobs && config.jobs.length) {
      saveResults.jobs = await this.saveJobs(config.jobs, jobPrefix);
    }

    // create the datafeeds
    if (config.datafeeds && config.datafeeds.length) {
      saveResults.datafeeds = await this.saveDatafeeds(config.datafeeds, jobPrefix);
    }

    // create the savedObjects
    if (config.kibana) {
      const savedObjects = await this.createSavedObjectsToSave(config);
      // update the exists flag in the results
      this.updateKibanaResults(results.kibana, savedObjects);
      // create the savedObjects
      saveResults.savedObjects = await this.saveKibanaObjects(savedObjects);
    }
    // merge all the save results
    this.updateResults(results, saveResults);
    return results;
  }

  async loadIndexPatterns() {
    return await this.savedObjectsClient.find({ type: 'index-pattern', perPage: 1000 });
  }

  async createSavedObjectsToSave(config) {
    // first check if the saved objects already exist.
    const savedObjectExistResults = await this.checkIfSavedObjectsExist(config.kibana, this.request);
    // loop through the kibanaSaveResults and update
    Object.keys(config.kibana).forEach((type) => {
      // type e.g. dashboard, search ,visualization
      config.kibana[type].forEach((configItem) => {
        const existsResult = savedObjectExistResults.find(o => o.id === configItem.id);
        if (existsResult !== undefined) {
          configItem.exists = existsResult.exists;
          if (existsResult.exists === false) {
            // if this object doesn't already exist, create the savedObject
            // which will be used to create it
            existsResult.savedObject = {
              type,
              id: configItem.id,
              attributes: configItem.config
            };
          }
        }
      });
    });
    return savedObjectExistResults;
  }

  // update the exists flags in the kibana results
  updateKibanaResults(kibanaSaveResults, objectExistResults) {
    Object.keys(kibanaSaveResults).forEach((type) => {
      kibanaSaveResults[type].forEach((resultItem) => {
        const i = objectExistResults.find(o => (o.id === resultItem.id && o.type === type));
        resultItem.exists = (i !== undefined);
      });
    });
  }

  // loop through each type (dashboard, search, visualization)
  // load existing savedObjects for each type and compare to find out if
  // items with the same id already exist.
  // returns a flat list of objects with exists flags set
  async checkIfSavedObjectsExist(kibanaObjects) {
    const types = Object.keys(kibanaObjects);
    const results = await Promise.all(types.map(async (type) => {
      const existingObjects = await this.loadExistingSavedObjects(type);
      return kibanaObjects[type].map((obj) => {
        const existingObject = existingObjects.saved_objects.find(o => (o.attributes && o.attributes.title === obj.title));
        return {
          id: obj.id,
          type,
          exists: (existingObject !== undefined)
        };
      });
    }));
    // merge all results
    return [].concat(...results);
  }

  // find all existing savedObjects for a given type
  loadExistingSavedObjects(type) {
    return this.savedObjectsClient.find({ type, perPage: 1000 });
  }

  // save the savedObjects if they do not exist already
  async saveKibanaObjects(objectExistResults) {
    let results = [];
    const filteredSavedObjects = objectExistResults.filter(o => o.exists === false).map(o => o.savedObject);
    if (filteredSavedObjects.length) {
      results = await this.savedObjectsClient.bulkCreate(filteredSavedObjects);
    }
    return results;
  }

  // save the jobs.
  // if any fail (e.g. it already exists), catch the error and mark the result
  // as success: false
  async saveJobs(jobs, jobPrefix) {
    return await Promise.all(jobs.map(async (job) => {
      const jobId = `${jobPrefix}${job.id}`;
      try {
        job.id = jobId;
        await this.saveJob(job);
        return { id: jobId, success: true };
      } catch (error) {
        return { id: jobId, success: false, error };
      }
    }));
  }

  async saveJob(job) {
    const { id: jobId, config: body } = job;
    return this.callWithRequest('ml.addJob', { jobId, body });
  }

  // save the datafeeds.
  // if any fail (e.g. it already exists), catch the error and mark the result
  // as success: false
  async saveDatafeeds(datafeeds, jobPrefix) {
    return await Promise.all(datafeeds.map(async (datafeed) => {
      const datafeedId = `${jobPrefix}${datafeed.id}`;
      try {
        datafeed.id = datafeedId;
        datafeed.config.job_id = `${jobPrefix}${datafeed.config.job_id}`;
        await this.saveDatafeed(datafeed);
        return { id: datafeedId, success: true };
      } catch (error) {
        return { id: datafeedId, success: false, error };
      }
    }));
  }

  async saveDatafeed(datafeed) {
    const { id: datafeedId, config: body } = datafeed;
    return this.callWithRequest('ml.addDatafeed', { datafeedId, body });
  }

  // merge all of the save results into one result object
  // which is returned from the endpoint
  async updateResults(results, saveResults) {
    // update job results
    results.jobs.forEach((j) => {
      saveResults.jobs.forEach((j2) => {
        if (j.id === j2.id) {
          j.success = j2.success;
          if (j2.error !== undefined) {
            j.error = j2.error;
          }
        }
      });
    });

    // update datafeed results
    results.datafeeds.forEach((d) => {
      saveResults.datafeeds.forEach((d2) => {
        if (d.id === d2.id) {
          d.success = d2.success;
          if (d2.error !== undefined) {
            d.error = d2.error;
          }
        }
      });
    });

    // update savedObjects results
    Object.keys(results.kibana).forEach((category) => {
      results.kibana[category].forEach((item) => {
        const result = saveResults.savedObjects.find(o => o.id === item.id);
        if (result !== undefined) {
          item.exists = result.exists;

          if (result.error === undefined) {
            item.success = true;
          } else {
            item.success = false;
            item.error = result.error;
          }
        }
      });
    });
  }

  // creates an empty results object,
  // listing each job/datafeed/savedObject with a save success boolean
  createResultsTemplate(config, jobPrefix) {
    const results = {};
    function createResultsItems(configItems, resultItems, index, lab = '') {
      resultItems[index] = [];
      configItems.forEach((j) => {
        resultItems[index].push({
          id: `${lab}${j.id}`,
          success: false
        });
      });
    }

    Object.keys(config).forEach((i) => {
      if (Array.isArray(config[i])) {
        createResultsItems(config[i], results, i, jobPrefix);
      } else {
        results[i] = {};
        Object.keys(config[i]).forEach((k) => {
          createResultsItems(config[i][k], results[i], k);
        });
      }
    });
    return results;
  }

  // loop through the custom urls in each job and switch the index pattern name the its id
  // for each job, load the indexes from it's associated datafeed.
  async updateJobUrls(config) {
    if (config.datafeeds && config.datafeeds.length) {
      const datafeeds = config.datafeeds;
      // loop through datafeeds
      datafeeds.forEach((df) => {
        // use the indices from the datafeed
        const indices = df.config.indexes;
        // find the job associated with the datafeed
        const job = config.jobs.find((j) => j.id === df.config.job_id);
        if (job !== undefined) {
          // loop through the indices
          indices.forEach((index) => {
            // if the job has custom_urls
            if (job.config.custom_settings && job.config.custom_settings.custom_urls) {
              // get the index pattern id
              const ipId = this.findIndexPatternId(index, this.indexPatterns);
              // loop through each url, replacing the index pattern name for its if=d
              job.config.custom_settings.custom_urls.forEach((cUrl) => {
                const url = cUrl.url_value;
                // the index name may or moy not be quoted
                const matchString = url.match(`index:${index}`) ? `index:${index}` : `index:'${index}'`;
                const newUrl = url.replace(new RegExp(this.escapeRegExp(matchString), 'g'), `index:\'${ipId}\'`);
                // update the job's url
                cUrl.url_value = newUrl;
              });
            }
          });
        }
      });
    }
  }

  escapeRegExp(str) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
  }

  // returns a id based on an index pattern name
  findIndexPatternId(name, indexPatterns) {
    const ip = indexPatterns.saved_objects.find((i) => i.attributes.title === name);
    return (ip !== undefined) ? ip.id : undefined;
  }
}
