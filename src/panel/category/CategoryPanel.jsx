/* global _ */
import React, { useState, useEffect, useContext } from 'react';
import PropTypes from 'prop-types';
import Panel from 'src/components/ui/Panel';
import debounce from 'lodash.debounce';

import PoiItemList from './PoiItemList';
import PoiItemListPlaceholder from './PoiItemListPlaceholder';
import CategoryPanelError from './CategoryPanelError';
import PJPartnershipFooter from './PJPartnershipFooter';
import Telemetry from 'src/libs/telemetry';
import nconf from '@qwant/nconf-getter';
import IdunnPoi from 'src/adapters/poi/idunn_poi';
import { getVisibleBbox } from 'src/panel/layouts';
import { fire, listen, unListen } from 'src/libs/customEvents';
import { boundsFromFlatArray, parseBboxString, boundsToString } from 'src/libs/bounds';
import classnames from 'classnames';
import { sources } from 'config/constants.yml';
import { DeviceContext } from 'src/libs/device';
import { PanelContext } from 'src/libs/panelContext';

const categoryConfig = nconf.get().category;
const MAX_PLACES = Number(categoryConfig.maxPlaces);
const DEBOUNCE_WAIT = 100;

function fitMap(bbox) {
  if (bbox) {
    fire('fit_map', parseBboxString(bbox));
    return;
  }

  const mapboxMap = window.map.mb;

  if (mapboxMap.isMoving && mapboxMap.isMoving()) {
    // Do not trigger API search and zoom change
    // when the map is already moving, to avoid flickering.
    // The search will be triggered on moveend.
    return;
  }

  // Apply correct zoom when opening a category
  const currentZoom = mapboxMap.getZoom();

  // Zoom < 5: focus on Paris
  if (currentZoom < 5) {
    mapboxMap.flyTo({ center: [2.35, 48.85], zoom: 12 });
  } else if (currentZoom < 12) { // Zoom < 12: zoom up to zoom 12
    mapboxMap.flyTo({ zoom: 12 });
  } else if (currentZoom > 18) { // Zoom > 18: dezoom to zoom 18
    mapboxMap.flyTo({ zoom: 18 });
  } else {
    // setting the same view still triggers the moveend event
    mapboxMap.jumpTo({ zoom: currentZoom, center: mapboxMap.getCenter() });
  }
}

const CategoryPanel = ({ poiFilters = {}, bbox }) => {
  const [pois, setPois] = useState([]);
  const [dataSource, setDataSource] = useState('');
  const [initialLoading, setInitialLoading] = useState(true);
  const isMobile = useContext(DeviceContext);
  const { size: panelSize } = useContext(PanelContext);

  useEffect(() => {
    const fetchData = debounce(async () => {
      const { category, query } = poiFilters;
      const currentBounds = getVisibleBbox(window.map.mb, window.no_ui);

      const extendBbox = initialLoading;
      const { places, source, bbox: contentBbox, bbox_extended } = await IdunnPoi.poiCategoryLoad(
        boundsToString(currentBounds),
        MAX_PLACES,
        category,
        query,
        extendBbox
      );

      setPois(places);
      setDataSource(source);
      setInitialLoading(false);

      if (bbox_extended && contentBbox) {
        // The returned bbox is sure to contain at least one POI.
        // Extend the current one to include it.
        fire('fit_map', currentBounds.extend(boundsFromFlatArray(contentBbox)), true);
      }

      fire('add_category_markers', places, poiFilters);
      fire('save_location');
    }, DEBOUNCE_WAIT, { leading: true });

    const mapMoveHandler = listen('map_moveend', fetchData);
    return () => { unListen(mapMoveHandler); };
  }, [poiFilters, initialLoading]);

  useEffect(() => {
    window.execOnMapLoaded(() => { fitMap(bbox); });
  }, [bbox, poiFilters]);

  useEffect(() => {
    setInitialLoading(true);
  }, [poiFilters]);

  useEffect(() => {
    if (poiFilters.category) {
      Telemetry.add(Telemetry.POI_CATEGORY_OPEN, { category: poiFilters.category });
    }
  }, [poiFilters.category]);

  const selectPoi = poi => {
    fire('click_category_poi', { poi, poiFilters, pois });
  };

  const highlightPoiMarker = (poi, highlight) => {
    fire('highlight_category_marker', poi, highlight);
  };

  let panelContent;

  if (initialLoading) {
    panelContent = <PoiItemListPlaceholder />;
  } else if (!pois || pois.length === 0) {
    panelContent = <CategoryPanelError zoomIn={!pois} />;
  } else {
    panelContent = <>
      <PoiItemList
        pois={pois}
        selectPoi={selectPoi}
        highlightMarker={highlightPoiMarker}
      />
      {dataSource === sources.pagesjaunes
        && panelSize !== 'minimized'
        && <PJPartnershipFooter isMobile={isMobile} />}
    </>;
  }

  return <Panel
    resizable
    minimizedTitle={_('Unfold to show the results', 'categories')}
    className={classnames('category__panel', { 'panel--pj': dataSource === sources.pagesjaunes })}
  >
    {panelContent}
  </Panel>;
};

CategoryPanel.propTypes = {
  poiFilters: PropTypes.object,
  bbox: PropTypes.string,
};

export default CategoryPanel;
