import histogramChart from '../../js/histogram-chart.js'
import * as dataManipulation from './js/dataManipulation.js'
import * as helpers from './js/helpers.js'
import {Dashboard} from './js/dashboard.js'

import './css/dashboard.css'

// require('file-loader!./assets/sf_logo_white.png')

/* page elements */
var estarHistogramElement = d3.select('#energy-star-score-histogram')
var estarWidth = 500 //parseInt(estarHistogramElement.style('width'))
var estarHistogram = histogramChart()
  .width(estarWidth)
  .height(200)
  .range([0,110])
  .tickFormat(d3.format(',d'))


Dashboard.displayPage = 'estar'

/**
* handlePropertyTypeResponse - do something with the returned data
* @param {array} rows - returned from consumer.query.getRows
*/
Dashboard.handlePropertyTypeResponse = function (rows) {
  //TODO: dataManipulation.parseSingleRecord finds the "latest" value for each metric, so the comparisons between buildings are not necessarially within the same year.  perhaps dataManipulation.parseSingleRecord should accept a param for year, passing to "latest" which finds that particular year instead of the "latest" metric. OR the apiCalls.propertyQuery call inside handleSingleBuildingResponse should take a param for year that only requests records which are not null for the individual building's "latest" metric year
  Dashboard.categoryData = rows.map(dataManipulation.parseSingleRecord)    // save data in global var
  Dashboard.categoryData = dataManipulation.cleanData(Dashboard.categoryData)        // clean data according to SFENV's criteria
  Dashboard.categoryData = dataManipulation.apiDataToArray( Dashboard.categoryData ) // filter out unwanted data

  let estarVals = helpers.objArrayToSortedNumArray(Dashboard.categoryData, 'latest_energy_star_score')
  estarVals = estarVals.filter(function (d) { return d > 0 })

  let euiVals = helpers.objArrayToSortedNumArray(Dashboard.categoryData,'latest_site_eui_kbtu_ft2')
  euiVals = euiVals.filter(function (d) { return d > 1 && d < 1000 })

  Dashboard.singleBuildingData.localRank = dataManipulation.rankBuildings(Dashboard.singleBuildingData.ID, Dashboard.categoryData)
  var estarQuartiles = helpers.arrayQuartiles(estarVals)

  Dashboard.color.energy_star_score.domain(estarQuartiles)
  Dashboard.color.ranking.domain([ 0.25*Dashboard.singleBuildingData.localRank[1], 0.5*Dashboard.singleBuildingData.localRank[1], 0.75*Dashboard.singleBuildingData.localRank[1] ])

  /* draw histogram for energy star */
  estarHistogram
    .colorScale(Dashboard.color.energy_star_score)
    .bins(20)
    .xAxisLabel('Energy Star Score')
    .yAxisLabel('Buildings')
  estarHistogramElement.datum(estarVals).call(estarHistogram)

  estarHistogramElement.call(Dashboard.addHighlightLine,Dashboard.singleBuildingData.latest_energy_star_score, estarHistogram,Dashboard.singleBuildingData.building_name)


  Dashboard.populateInfoBoxes(Dashboard.singleBuildingData, Dashboard.categoryData, Dashboard.floorAreaRange)

  $('#view-load').addClass('hidden')
  $('#view-content').removeClass('hidden')
}

setTimeout(Dashboard.setSidePanelHeight, 1000)

Dashboard.startQuery()
