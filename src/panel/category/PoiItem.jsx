import React from 'react';
import OpeningHour from 'src/components/OpeningHour';
import OsmSchedule from 'src/adapters/osm_schedule';
import ReviewScore from 'src/components/ReviewScore';
import PhoneNumber from './PhoneNumber';
import poiSubClass from 'src/mapbox/poi_subclass';
import PoiTitleImage from 'src/panel/poi/PoiTitleImage';

const PoiItem = ({ poi, onShowPhoneNumber }) => {
  const reviews = poi.blocksByType.grades;
  const phoneBlock = poi.blocksByType.phone;
  const address = poi.address || {};

  const Subclass = () =>
    poi.subClassName
      ? <p className="u-text--subtitle u-firstCap">{poiSubClass(poi.subClassName)}</p>
      : <br/>
  ;

  const Address = () =>
    address.label
      ? <p className="u-text--subtitle PoiItem-address">{address.label}</p>
      : <br />
  ;

  const Reviews = () =>
    reviews
      ? <div className="PoiItem-reviews">
        <ReviewScore reviews={reviews} poi={poi} inList />
        <OpeningHour
          schedule={new OsmSchedule(poi.blocksByType.opening_hours)}
          showNextOpenOnly={true} />
      </div>
      : null
  ;

  const Phone = () =>
    phoneBlock
      ? <PhoneNumber
        phoneBlock={phoneBlock}
        onReveal={() => { onShowPhoneNumber(poi); }} />
      : null
  ;

  return <div className="PoiItem">
    <div>
      {/* @TODO: use a better-named fonction that returns the best 'name' */}
      <h3 className="u-text--smallTitle">{poi.getInputValue()}</h3>
      <Subclass />
      <Address />
      <Reviews />
      <Phone />
    </div>

    <div className="PoiItem-right">
      <PoiTitleImage poi={poi} />
    </div>
  </div>;
};

export default PoiItem;