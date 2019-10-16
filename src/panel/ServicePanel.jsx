/* global _ */
import React from 'react';
import Panel from 'src/components/ui/Panel';
import CategoryService from '../adapters/category_service';
import nconf from '@qwant/nconf-getter';

class ServicePanel extends React.Component {
  render() {
    return <Panel
      resizable
      title={_('Qwant Maps services', 'service panel')}
      minimizedTitle={_('Show Qwant Maps services', 'service panel')}
      className='service_panel'
    >
      <div className="service_panel__categories">
        {
          CategoryService.getCategories().map(item =>
            <button className="service_panel__category" type="button" key={item.name}
              onClick={() => { window.app.navigateTo(`/places/?type=${item.name}`); }}>
              <div className="service_panel__category__icon"
                style={{ background: item.backgroundColor }}>
                <span className={`icon icon-${item.iconName}`}/>
              </div>
              <div className="service_panel__category__title">{item.label}</div>
            </button>
          )
        }
      </div>

      <hr/>
      <br/>
      <div className="service_panel__actions">

        {
          nconf.get().direction.enabled && <button
            onClick={() => { window.app.navigateTo('/routes/'); }}
            className="service_panel__action service_panel__item__direction">
            <div className="service_panel__action__icon">
              <span className="icon-corner-up-right"/>
            </div>
            <div className="service_panel__action__title">{_('Directions', 'service panel')}</div>
          </button>
        }

        <button className="service_panel__action service_panel__item__fav"
          onClick={() => { window.app.navigateTo('/favs'); }}>
          <div className="service_panel__action__icon">
            <span className="icon-icon_star"/>
          </div>
          <div className="service_panel__action__title">{ _('Favorites', 'service panel')}</div>
        </button>

      </div>
    </Panel>;
  }
}

export default ServicePanel;