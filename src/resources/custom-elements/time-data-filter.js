import {bindable} from "aurelia-framework";
import moment from "moment";
import * as d3 from "d3";

export class TimeDataFilter {
    @bindable timeData;
    @bindable width;
    @bindable height;

    selectedYear;

    yearlyData;

    get yearlyHeight () {
        // If the year is not selected, the yearly data takes up the entire height.
        // Otherwise is just takes up the specified proportion.
        return this.selectedYear ? this.height - (this.width / 3) : this.height;
    }

    get dailyHeight () {
        // If the year is selected, the daily data takes up half the remaining area.
        // Otherwise it's not displayed.
        return this.selectedYear ? (this.width / 6) : 0;
    }
    
    get itemHeight () {
        // If the year is selected, the item data takes up half the remaining area.
        // Otherwise it's not displayed.
        return this.selectedYear ? (this.width / 6) : 0;
    }

    async attached () {
        this.yearlyData = await this.timeData.getYearlyData();
        this.populateYearlyData();
    }

    populateYearlyData() {
        populateYearlyData(
            this.yearlySvg,
            this.yearlyData,
            year => this.handleYearSelected(year));
    }

    async handleYearSelected(year) {
        if (!this.selectedYear) {
            this.selectedYear = year;

            this.yearlySvg.setAttribute("height", this.yearlyHeight);
            this.dailySvg.setAttribute("height", this.dailyHeight);
            this.itemSvg.setAttribute("height", this.itemHeight);

            // Repopulate yearly data because svg size has changed
            this.populateYearlyData();
        }

        // Pad the data out by a month on either side
        let fromMoment = moment([year]).subtract(1, "month").startOf("month");
        let toMoment = moment([year]).endOf("year").add(1, "month").endOf("month");
        let fromDate = fromMoment.toDate();
        let toDate = toMoment.toDate();
        
        this.dataPoints = await this.timeData.getDataPoints(fromDate, toDate);

        populateDailyData(this.dailySvg, year, fromDate, toDate, this.dataPoints,
            (from, to) => this.handleRangeChanged(from, to));

        this.handleRangeChanged(fromDate, toDate);
    }

    handleRangeChanged(fromDate, toDate) {
        populateDataPoints(this.itemSvg, fromDate, toDate, this.dataPoints);
    }
}

function populateYearlyData(svgElem, yearlyData, yearSelectionHandler) {
    let svg = d3.select(svgElem);
    svg.selectAll("*").remove();

    let dimensions = getDimensions(svg, {top: 20, right: 20, bottom: 30, left: 40});
    let scale = {
        x: d3.scaleBand()
            .rangeRound([0, dimensions.width])
            .padding(0.1)
            .domain(yearlyData.map(d => d.year)),
        y: d3.scaleLinear()
            .rangeRound([dimensions.height, 0])
            .domain([0, d3.max(yearlyData, d => d.count)])
    };

    let axes = {
        x: d3.axisBottom(scale.x),
        y: d3.axisLeft(scale.y)
    }

    let group = svg.append("g")
        .attr("transform", `translate(${dimensions.margin.left}, ${dimensions.margin.top})`);

    group.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", `translate(0, ${dimensions.height})`)
        .call(axes.x);

    group.append("g")
        .attr("class", "axis axis--y")
        .call(axes.y)
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", "0.71em")
        .attr("text-anchor", "end")
        .text("Count");

    group.selectAll(".bar")
        .data(yearlyData)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", d => scale.x(d.year))
        .attr("y", d => scale.y(d.count))
        .attr("width", scale.x.bandwidth())
        .attr("height", d => dimensions.height - scale.y(d.count))
        .on("click", d => yearSelectionHandler(d.year));
}

let populateDailyData = debounce((svgElem, year, fromDate, toDate, dataPoints, rangeSelectionHandler) => {
    let fromMoment = moment(fromDate);
    let toMoment = moment(toDate);

    let dataMap = new Map();
    dataPoints.forEach(d => {
        let day = moment(d.date).startOf("day").toDate().getTime();
        dataMap.set(day, (dataMap.get(day) || 0) + 1);
    });

    let svg = d3.select(svgElem);
    svg.selectAll("*").remove();

    let dimensions = getDimensions(svg, {top: 20, right: 20, bottom: 30, left: 40});

    let weekCount = toMoment.diff(fromMoment.startOf("week"), "weeks") + 1;
    let cellWidth = dimensions.width / weekCount;
    let cellHeight = dimensions.height / 7;

    let group = svg
        .append("g")
        .attr("transform", `translate(${dimensions.margin.left}, ${dimensions.margin.top})`)
        .attr("class", "photo-count");

    let maxDailyCount = d3.max(Array.from(dataMap.values()));
    let dateColor = d3.scaleQuantize()
        .domain([0, maxDailyCount])
        .range(d3.range(9).map(d => `q${d}-9`));

    let dayRects = group.selectAll(".day")
        .data(d3.timeDays(fromDate, toDate))
        .enter()
        .append("rect")
        .attr("class", "day")
        .attr("width", cellWidth)
        .attr("height", cellHeight)
        .attr("x", d => moment(d).diff(fromMoment.startOf("week"), "weeks") * cellWidth)
        .attr("y", d => d.getDay() * cellHeight)
        .attr("class", d => `day ${dateColor(dataMap.get(d.getTime()) || 0)}`);

    let monthPath = t0 => {
        t0 = moment(t0);
        let t1 = moment(t0).add(1, "month");
        let d0 = t0.day();
        let w0 = t0.diff(fromMoment, "weeks");
        let d1 = t1.day();
        let w1 = t1.diff(fromMoment, "weeks");

        return `M${(w0 + 1) * cellWidth},${d0 * cellHeight}` +
            `H${w0 * cellWidth}V${7 * cellHeight}` +
            `H${w1 * cellWidth}V${d1 * cellHeight}` +
            `H${(w1 + 1) * cellWidth}V0` +
            `H${(w0 + 1) * cellWidth}Z`;
    };

    let monthGroups = group.selectAll("g[data-month]")
        .data(d3.timeMonths(fromDate, toDate))
        .enter()
        .append("g")
        .attr("data-month", true);

    monthGroups
        .append("path")
        .attr("class", "month")
        .attr("d", monthPath);

    let scale = d3.scaleTime()
        .range([0, cellWidth])
        .domain([fromMoment.weekday(0).toDate(), fromMoment.weekday(0).add(7, "days").toDate()]);

    monthGroups
        .append("text")
        .attr("transform", d => {
            // Place the label halfway through the month
            let monthStartMoment = moment(d);
            let hoursToMiddleOfMonth = (monthStartMoment.daysInMonth() / 2) * 24;
            let middleOfMonth = monthStartMoment.add(hoursToMiddleOfMonth, "hours");
            return `translate(${scale(middleOfMonth.toDate())}, -6)`;
        })
        .style("text-anchor", "middle")
        .style("font-family", "sans-serif")
        .style("font-size", 10)
        .text(d => d3.timeFormat("%b %y")(d));

    let brushed = () => {
        // Get the range [fromX, toX] and work out the domain (date range)
        let range = d3.event.selection;
        let domain = range.map(scale.invert);

        rangeSelectionHandler(domain[0], domain[1]);
    }

    // Create a brush over the chart area
    let brush = d3.brushX()
        .extent([[0, -dimensions.margin.bottom], [dimensions.width, dimensions.height + dimensions.margin.top]])
        .on("brush end", brushed);

    // Add the brush to the group
    let brushFrom = moment([year]).toDate();
    let brushTo = moment([year]).endOf("year").toDate();
    group.append("g")
        .attr("class", "brush")
        .call(brush)
        .call(brush.move, [scale(brushFrom), scale(brushTo)]);
});

let populateDataPoints = debounce((svgElem, fromDate, toDate, data) => {
    let fromMoment = moment(fromDate);
    let toMoment = moment(toDate);

    let svg = d3.select(svgElem);
    svg.selectAll("*").remove();

    let dimensions = getDimensions(svg, {top: 20, right: 20, bottom: 30, left: 40});
    let dateToTime = date => moment(date).year(2000).month(0).date(1).toDate();
    let scale = {
        x: d3.scaleTime()
            .range([0, dimensions.width])
            .domain(d3.extent([fromDate, toDate])),
        y: d3.scaleTime()
            .range([0, dimensions.height])
            .domain([dateToTime(moment().startOf("day")), dateToTime(moment().endOf("day"))])
    };

    let axes = {
        x: d3.axisBottom()
            .scale(scale.x)
            .tickSize(-dimensions.height, 0)
            .tickFormat(d3.timeFormat("%d %b")),
        y: d3.axisLeft()
            .scale(scale.y)
            .ticks(5)
            .tickSize(-dimensions.width, dimensions.margin.left)
            .tickFormat(d3.timeFormat("%H:%M"))
    }

    // Create a clip path over the focus area to cut off any part falling outside the chart dimensions
    // (which can happen when zooming)
    let defs = svg.append("defs");
    defs.append("clipPath")
        .attr("id", "data-point-clip")
        .append("rect")
        .attr("width", dimensions.width)
        .attr("height", dimensions.height);

    let group = svg.append("g")
        .attr("class", "context")
        .attr("transform", `translate(${dimensions.margin.left}, ${dimensions.margin.top})`);

    group.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", `translate(0, ${dimensions.height})`)
        .call(axes.x);

    group.append("g")
        .attr("class", "axis axis--y")
        //.attr("transform", `translate(-10, 0)`)
        .call(axes.y);

    group.selectAll(".circ")
        .data(data.filter(d => d.date >= fromDate && d.date < toDate))
        .enter()
        .append("circle")
        .attr("class", "circ")
        .attr("cx", d => scale.x(d.date))
        .attr("cy", d => scale.y(dateToTime(d.date)))
        .attr("r", 5)
        .on("click", d => info.text(JSON.stringify(d)));
}, 100);

function debounce(func, wait) {
    let timeout;
    return function () {
        let context = this;
        let args = arguments;

        if (timeout) {
            return;
        }

        timeout = setTimeout(() => {
            func.apply(context, args);
            timeout = null;
        }, wait);
    };
}

function getDimensions (svg, margin) {
    return {
        width: svg.attr("width") - margin.left - margin.right,
        height: svg.attr("height") - margin.top - margin.bottom,
        margin: margin
    };
}
