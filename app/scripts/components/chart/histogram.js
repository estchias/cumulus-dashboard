'use strict';
import React from 'react';
import { get } from 'object-path';
import { scaleLinear, scaleBand } from 'd3-scale';
import debounce from 'lodash.debounce';
import { tally } from '../../utils/format';

import LoadingIndicator from '../app/loading-indicator';

const margin = {
  top: 50,
  right: 15,
  bottom: 15,
  left: 70
};

const Histogram = React.createClass({
  propTypes: {
    data: React.PropTypes.object
  },

  getInitialState: function () {
    return {
      width: 0,
      height: 0
    };
  },

  onWindowResize: function () {
    let rect = this.refs.chartContainer.getBoundingClientRect();
    this.setState({ width: rect.width, height: rect.height });
  },

  componentDidMount: function () {
    this.onWindowResize();
    this.onWindowResize = debounce(this.onWindowResize, 200);
    window.addEventListener('resize', this.onWindowResize);
  },

  render: function () {
    const { width, height } = this.state;
    const { inflight, data } = this.props.data;
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // short circuit if the area is too small; loading if the data is inflight
    if (innerWidth <= 0) return <div className='chart__container' ref='chartContainer' />;
    else if (inflight && !data) {
      return (
        <div className='chart__container' ref='chartContainer'>
          <LoadingIndicator />
        </div>
      );
    }

    const histogram = get(data, 'histogram', []);

    const xScale = scaleLinear()
    .range([0, innerWidth])
    .domain([0, 1.25 * Math.max.apply(Math, histogram.map(d => +d.count))]);

    const scaleOrdinal = scaleBand()
    .paddingInner(0.6)
    .paddingOuter(0.2);

    const yScale = scaleOrdinal
    .rangeRound([0, innerHeight])
    .domain(histogram.map(d => d.date));

    const band = yScale.bandwidth();

    return (
      <div className='chart__container' ref='chartContainer'>
        <svg className='chart' width={width} height={height} ref='svg'>

          <g className='axis axis__top' transform={`translate(${margin.left}, ${margin.top})`}>
            <line
              className='axis__line'
              x1='0'
              x2={innerWidth}
            />
            {xScale.ticks(3).map((label, i) => {
              // don't render the first tick
              if (!i) return <g key={label}></g>;
              return <g key={label} transform={`translate(${xScale(label)}, 0)`}>
                <line className='axis__tick'
                  y1='-4'
                  y2='0'
                />
                <text className='axis__text'
                  dy={-8}
                  textAnchor={'middle'}>{tally(label)}</text>
              </g>;
            })}
          </g>

          <g className='axis axis__left' transform={`translate(${margin.left}, ${margin.top})`}>
            <line
              className='axis__line'
              y1='0'
              y2={innerHeight}
            />
            {histogram.map(d => {
              return <g key={d.date} transform={`translate(0, ${yScale(d.date)})`}>
                <line className='axis__tick'
                  x1='-4'
                  x2='0'
                />
                <text className='axis__text'
                  dx='-8'
                  dy='3'
                  textAnchor={'end'}>{d.date}</text>
              </g>;
            })}
          </g>

          <g transform={`translate(${margin.left}, ${margin.top})`}>
            {histogram.map(d => {
              return <rect
                key={d.date}
                className='chart__bar'
                x={0}
                y={yScale(d.date) - band / 2}
                width={xScale(+d.count)}
                height={band}
              />;
            })}
          </g>

        </svg>
      </div>
    );
  }
});
export default Histogram;