import {inject, bindable, bindingMode} from "aurelia-framework";
import {Endpoint} from "aurelia-api";
import moment from "moment";
import * as d3 from "d3";

@inject(Element, "image-service")
export class TimePhotoFilter {
    @bindable width;
    @bindable height;
    @bindable maxDayRange = 30;

    @bindable({ defaultBindingMode: bindingMode.twoWay }) fromDate;
    @bindable({ defaultBindingMode: bindingMode.twoWay }) toDate;

    displayFromDate;
    displayToDate;
    yearlyData;
    dataPoints;

    constructor (element, imageService) {
        this._element = element;
        this._imageService = imageService;
    }

    get isFiltered () {
        return this.displayFromDate && this.displayToDate;
    }

    get yearlyHeight () {
        // If the year is not selected, the yearly data takes up the entire height.
        // Otherwise is just takes up the specified proportion.
        return this.isFiltered ? this.height - (this.width / 3) : this.height;
    }

    get dailyHeight () {
        // If the year is selected, the daily data takes up half the remaining area.
        // Otherwise it's not displayed.
        return this.isFiltered ? (this.width / 6) : 0;
    }
    
    get itemHeight () {
        // If the year is selected, the item data takes up half the remaining area.
        // Otherwise it's not displayed.
        return this.isFiltered ? (this.width / 6) : 0;
    }

    async attached () {
        await this.refreshYearlyData();
        this.populateYearlyData();

        if (this.isFiltered) {
            await this.refreshDataPoints();

            this.populateDailyData();
            this.populateDataPoints();
        }
    }

    async refreshYearlyData () {
        this.yearlyData = await this._imageService.getYearlyTotals();
    }

    async refreshDataPoints () {
        let criteria = {
            fromLocal: moment(this.displayFromDate).toISOString(),
            toLocal: moment(this.displayToDate).toISOString()
        };

        let names = await this._imageService.search(criteria);

        let includes = { takenDateTime: true };
        let images = await this._imageService.retrieve(names, includes);

        this.dataPoints = images.map(img => ({
            id: img.id,
            date: new Date(img.takenLocal)
        }));

        this.setFromDate(d3.min(this.dataPoints, d => d.date) || this.fromDate);
        this.setToDate(moment(this.fromDate).add(this.maxDayRange, "days").toDate());
    }

    setDisplayYear(year) {
        let wasFiltered = this.isFiltered;

        // Pad the data out by a month on either side
        this.displayFromDate = moment([year]).subtract(1, "month").startOf("month").toDate();
        this.displayToDate = moment([year]).endOf("year").add(1, "month").endOf("month").toDate();

        if (!wasFiltered) {
            this.yearlySvg.setAttribute("height", this.yearlyHeight);
            this.dailySvg.setAttribute("height", this.dailyHeight);
            this.itemSvg.setAttribute("height", this.itemHeight);

            // Repopulate yearly data because svg size has changed
            this.populateYearlyData();
        } 
    }

    setFromDate(date) {
        let currentTime = this.fromDate && this.fromDate.getTime() || 0;
        let newTime = date && date.getTime() || 0;
        if (currentTime !== newTime) {
            this.fromDate = date;
            this.raiseChangeEvent();
        }
    }

    setToDate(date) {
        let currentTime = this.toDate && this.toDate.getTime() || 0;
        let newTime = date && date.getTime() || 0;
        if (currentTime !== newTime) {
            this.toDate = date;
            this.raiseChangeEvent();
        }
    }

    raiseChangeEvent() {
        let changeEvent = new CustomEvent("change", {
            detail: {
                value: {fromDate: this.fromDate, toDate: this.toDate}
            },
            bubbles: true
        });

        this._element.dispatchEvent(changeEvent);
    }

    populateYearlyData() {
        populateYearlyData(
            this.yearlySvg,
            this.yearlyData,
            async year => {
                this.setDisplayYear(year);

                await this.refreshDataPoints();

                this.populateDailyData();
                this.populateDataPoints();
            });
    }

    populateDailyData() {
        populateDailyData(
            this.dailySvg,
            this.displayFromDate,
            this.displayToDate,
            this.fromDate,
            this.toDate,
            this.maxDayRange,
            this.dataPoints,
            (fromDate, toDate) => {
                this.setFromDate(fromDate);
                this.setToDate(toDate);

                this.populateDataPoints();
            });
    }

    populateDataPoints() {
        populateDataPoints(this.itemSvg, this.fromDate, this.toDate, this.dataPoints);
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

let populateDailyData = debounce((svgElem, fromDate, toDate, brushFromDate, brushToDate, maxDayRange, dataPoints, rangeSelectionHandler) => {
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

    let maxDailyCount = d3.max(Array.from(dataMap.values())) || 1;
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

    // Create a brush over the chart area
    let brush = d3.brushX()
        .extent([[0, -dimensions.margin.bottom], [dimensions.width, dimensions.height + dimensions.margin.top]]);

    // Add the brush to the group
    let brushGroup = group.append("g")
        .attr("class", "brush")
        .call(brush)
        .call(brush.move, [scale(brushFromDate), scale(brushToDate)]);

    brush.on("brush end", () => {
        // Get the range [fromX, toX] and work out the domain (date range)
        let range = d3.event.selection;
        let domain = range.map(scale.invert);

        if (moment(domain[1]).diff(moment(domain[0]), "days") > maxDayRange) {
            // Too great a range - need to adjust it
            if (domain[1] > brushToDate) {
                // Moving right
                brushToDate = domain[1];
                brushFromDate = moment(brushToDate).subtract(maxDayRange, "days").toDate();
            } else {
                // Moving left
                brushFromDate = domain[0];
                brushToDate = moment(brushFromDate).add(maxDayRange, "days").toDate();
            }

            brushGroup.call(brush.move, [scale(brushFromDate), scale(brushToDate)]);
        } else {
            brushFromDate = domain[0];
            brushToDate = domain[1];

            rangeSelectionHandler(brushFromDate, brushToDate);
        }
    });
});

let populateDataPoints = debounce((svgElem, fromDate, toDate, data) => {
    // Make sure the dates have values
    fromDate = fromDate || new Date();
    toDate = toDate || new Date();
    toDate = new Date(Math.max(fromDate, toDate));

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
