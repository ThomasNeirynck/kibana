import React from 'react';
import { withBreadcrumbs } from 'react-router-breadcrumbs-hoc';
import { toQuery } from '../../../utils/url';
import { routes } from './routeConfig';
import { flatten } from 'lodash';

function capitalize(str = '') {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

class Breadcrumbs extends React.Component {
  componentWillUpdate() {}

  render() {
    const { breadcrumbs, location } = this.props;
    const _g = toQuery(location.search)._g;

    return (
      <div className="kuiLocalBreadcrumbs">
        {breadcrumbs.map(({ breadcrumb, path, match }, i) => {
          const isLast = i === breadcrumbs.length - 1;
          return (
            <div
              key={path}
              className="kuiLocalBreadcrumb"
              style={{ lineHeight: '29px' }}
            >
              {isLast ? (
                <span
                  ref={node => {
                    if (node && document.title !== node.innerText) {
                      document.title = capitalize(node.innerText);
                    }
                  }}
                >
                  {breadcrumb}
                </span>
              ) : (
                <a href={`#${match.url}?_g=${_g}`}>{breadcrumb}</a>
              )}
            </div>
          );
        })}
      </div>
    );
  }
}

const flatRoutes = flatten(
  routes.map(route => (route.switch ? route.routes : route))
);

export default withBreadcrumbs(flatRoutes)(Breadcrumbs);
