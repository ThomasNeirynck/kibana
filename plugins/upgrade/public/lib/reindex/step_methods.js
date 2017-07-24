import {
  getIndexSuffix,
  getUpgradedMappings,
  getUpgradedSettings,
  getReindexBody,
  getActionsForAliasesBody,
} from '../util';

import {
  ERR_CODES,
} from '../../../common/constants';

import {
  getFromApi,
  postToApi,
  putToApi,
  deleteFromApi,
} from '../request';



export async function getAssistance() {
  return await getFromApi(`/api/migration/assistance`);
}

export async function getMappingsAndSettings(indexName) {
  try {
    const mappingsAndSettings = await getFromApi(`/api/migration/flat_settings/${ indexName }`);

    // If indexName has already been reindexed,
    // mappingsAndSettings[indexName] will be undefined
    if (Object.values(mappingsAndSettings)[0]) {
      return Object.values(mappingsAndSettings)[0];
    }

  } catch (error) {
    if (!error.code) {
      error.code = ERR_CODES.ERR_GET_MAPPINGS_SETTINGS_FAILED;
    }

    throw error;
  }
};

export async function createIndex(indexName, definition) {
  try {
    const { mappings, settings } = definition;
    const suffix = getIndexSuffix(indexName);

    await putToApi(
      `/api/migration/${ indexName }${ suffix }`,
      {
        mappings: getUpgradedMappings(indexName, mappings),
        settings: getUpgradedSettings(settings),
      });

  } catch (error) {
    if (!error.code) {
      error.code = ERR_CODES.ERR_CREATE_INDEX_FAILED;
    }

    const suffix = getIndexSuffix(indexName);
    error.reindexedIndexName = `${ indexName }${ suffix }`;
    throw error;
  }
}

export async function setReadOnly(indexName) {
  try {
    return await putToApi(`/api/migration/settings/${ indexName }`,
      { 'index.blocks.write' : true });

  } catch (error) {
    if (!error.code) {
      error.code = ERR_CODES.ERR_SET_READONLY_FAILED;
    }
    throw error;
  }
}

export async function runReindex(indexName) {
  try {
    const body = getReindexBody(indexName);
    return await postToApi(
      `/api/migration/reindex/${ indexName }`,
      body,
    );

  } catch (error) {
    if (!error.code) {
      error.code = ERR_CODES.ERR_POST_REINDEX_FAILED;
    }
    throw error;
  }
}

export async function getTaskDetails(taskId) {
  try {
    return await getFromApi(`/api/migration/task/${ taskId }`);

  } catch (error) {
    if (!error.code) {
      error.code = ERR_CODES.ERR_GET_TASK_FAILED;
    }

    error.taskId = taskId;
    throw error;
  }
}

export async function cancelTask(taskId) {
  try {
    return await postToApi(`/api/migration/task/${ taskId }`);

  } catch (error) {
    if (!error.code) {
      error.code = ERR_CODES.ERR_CANCEL_TASK_FAILED;
    }
    error.taskId = taskId;
    throw error;
  }
}

export async function refreshIndex(indexName) {
  try {
    const suffix = getIndexSuffix(indexName);
    return await postToApi(`/api/migration/refresh/${ indexName }${ suffix }`);

  } catch (error) {
    if (!error.code) {
      error.code = ERR_CODES.ERR_POST_REFRESH_FAILED;
    }
    throw error;
  }
}

export async function verifyDocs(indexName) {
  try {
    const suffix = getIndexSuffix(indexName);
    const newDocs = await getFromApi(`/api/migration/count/${ indexName }${ suffix }`);
    const oldDocs = await getFromApi(`/api/migration/count/${ indexName }`);

    if (newDocs.count !== oldDocs.count) {
      throw new Error('Document counts are not equal in old and new indices.');
    }

    return true;

  } catch (error) {
    if (!error.code) {
      error.code = ERR_CODES.ERR_COUNT_DOCS_FAILED;
    }
    throw error;
  }
}

export async function getSettingsAndAliases(indexName) {
  try {
    return await getFromApi(`/api/migration/flat_settings/${ indexName }/_settings,_aliases`);

  } catch (error) {
    if (!error.code) {
      error.code = ERR_CODES.ERR_GET_SETTINGS_ALIASES_FAILED;
    }
    throw error;
  }
}

export async function updateRefreshInterval(indexName, settings) {
  try {
    const refreshInterval = settings['index.refresh_interval'] || "1s";
    const suffix = getIndexSuffix(indexName);
    await putToApi(`/api/migration/settings/${ indexName }${ suffix }`,
      { "index.refresh_interval": refreshInterval });

  } catch (error) {
    if (!error.code) {
      error.code = ERR_CODES.ERR_UPDATE_REFRESH_INTERVAL_FAILED;
    }
    throw error;
  }
}

export async function replaceIndex(indexName, aliases) {
  try {
    const actions = getActionsForAliasesBody(aliases, indexName);
    const aliasesBody = { actions };

    await postToApi(`/api/migration/aliases`, aliasesBody);

  } catch (error) {
    if (!error.code) {
      error.code = ERR_CODES.ERR_REPLACE_INDEX_FAILED;
    }
    throw error;
  }
}

export async function deleteTask(indexName, taskId) {
  try {
    return await deleteFromApi(`/api/migration/task/${ taskId }`);

  } catch (error) {
    if (!error.code) {
      error.code = ERR_CODES.ERR_DELETE_TASK_FAILED;
    }

    throw error;
  }
}

// Reset Index
// Attempts to set the index state so that its action can be performed again.
// * Tries to delete the existing index. This should
// only be hit if the create index step succeeded.
// * Sets the original index writeable.
// * Deletes any task that might exist. This would be
// hit if the replace-index step failed but the task
// succeeded.
export async function resetIndex(indexName, taskId) {
  try {
    const suffix = getIndexSuffix(indexName);
    await deleteFromApi(`/api/migration/index/${ indexName }${ suffix }`);
  } catch (error) {
    // If delete index fails because index doesn't
    // exist, continue. It might have been deleted
    // manually by the user.
    if (error.code !== ERR_CODES.ERR_DELETE_INDEX_FAILED) {
      throw error;
    }
  }

  try {
    await putToApi(`/api/migration/settings/${ indexName }`,
      { 'index.blocks.write' : false });

    if (taskId) {
      await deleteTask(indexName, taskId);
    }

  } catch (error) {
    if (error.code === ERR_CODES.ERR_DELETE_TASK_FAILED) {
      // Delete task failed because task doesn't
      // exist. Continue.
      return;
    }

    if (!error.code) {
      error.code = ERR_CODES.ERR_RESET_INDEX_FAILED;
    }

    throw error;
  }
}

export async function runUpgrade(indexName) {
  try {
    return await postToApi(`/api/migration/upgrade/${ indexName }`);

  } catch (error) {
    if (!error.code) {
      error.code = ERR_CODES.ERR_POST_UPGRADE_FAILED;
    }
    throw error;
  }
}

