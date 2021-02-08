const PDFDocument = require('pdfkit');

class PdfkitConstruct extends PDFDocument {

    // A4: [595.28, 841.89],

    #width = 0;
    #height = 0;
    #bodyheight = 0;

    #margin = {top: 10, left: 10, right: 10, bottom: 10};


    tables = [];

    #tableOptions = {
        width: "auto", // auto | fill_body
        marginLeft: 0,
        marginRight: 0,
        marginTop: 0,
        marginBottom: 5,
        border: {size: .1, color: '#cdcdcd'},
        striped: false,
        stripedColors: ['#fff', '#f0ecd5'],

        headBackground: '#abc6f0',
        headAlign: 'center',
        headColor: '#000',
        headFont: "Helvetica-Bold",
        headFontSize: 10,
        headHeight: 10,

        cellsFont: "Helvetica",
        cellsFontSize: 9,
        cellsAlign: 'center',
        cellsColor: "#000",
        cellsPadding: 5,
        cellsMaxWidth: 120
    };

    header = {
        isVisible: false,
        options: {
            height: '10%',
        },
        x: 0,
        y: 0
    };

    footer = {
        isVisible: false,
        options: {
            height: '5%',
        },
        x: 0,
        y: 0
    };

    constructor(options) {
        super(options);

        this.tables = [];

        this.#margin = this.options.margin ? {
            top: this.options.margin,
            left: this.options.margin,
            right: this.options.margin,
            bottom: this.options.margin
        } : this.#margin;

        this.#margin = this.options.margins || this.#margin;

        this.#width = this.page.width - this.#margin.left - this.#margin.right;
        this.#height = this.page.height - this.#margin.top - this.#margin.bottom;
        this.#bodyheight = this.#height;
    }

    setDocumentHeader(options, renderCallback) {


        if (!options) throw new Error("Header options are not set !");

        if (!renderCallback) throw new Error("Header rendering callback not set !");

        if (options) {
            for (let prop in options) {
                this.header.options[prop] = options[prop];
            }
        }

        if (typeof this.header.options.height == "number") {

            this.header.options.heightNumber = this.header.options.height;
        } else if (typeof this.header.options.height == "string") {

            let percentageHeight = Number(this.header.options.height.replace("%", ""));

            if (isNaN(percentageHeight))
                throw new Error("Invalid header height percentage !");

            this.header.options.heightNumber = (percentageHeight / 100) * this.page.height;
        } else
            throw new Error("Unexpected type error: Header height must be a percentage or fixed number !");

        this.header.x = this.#margin.left;
        this.header.y = this.#margin.top;

        this.header.isVisible = true;
        this.header.render = renderCallback;

    }

    setDocumentFooter(options, renderCallback) {

        if (!options) throw new Error("Footer options are not set !");
        if (!renderCallback) throw new Error("Footer rendering callback not set !");

        if (options) {
            for (let prop in options) {
                this.footer.options[prop] = options[prop];
            }
        }

        if (typeof this.footer.options.height == "number") {
            this.footer.options.heightNumber = this.footer.options.height;
        } else if (typeof this.footer.options.height == "string") {
            let percentageHeight = Number(this.footer.options.height.replace("%", ""));

            if (isNaN(percentageHeight)) throw new Error("Invalid footer height percentage !");

            this.footer.options.heightNumber = (percentageHeight / 100) * this.page.height;
        } else
            throw new Error("Unexpected type error: Footer height must be a percentage or fixed number !");


        this.#bodyheight -= this.footer.options.heightNumber;

        this.footer.x = this.#margin.left;
        this.footer.y = this.page.height - this.footer.options.heightNumber;

        this.footer.isVisible = true;
        this.footer.render = renderCallback;

    }

    addPageDoc() {

        // add page with same options
        this.addPage(this.options);

        // render header if set
        this.header.isVisible && this.header.render();

        // render footer if set
        this.footer.isVisible && this.footer.render();
    }

    addTable(columns, rows, options = null) {


        if (!columns || columns.length === 0) throw new Error("Columns are not set !");

        if (this.#hasDuplicatedKeys(columns)) throw new Error("Column key should be unique.");

        if (!rows || rows.length === 0) throw new Error("rows are not set !");

        if (options) {
            for (let prop in this.#tableOptions) {
                if (!options.hasOwnProperty(prop)) {
                    options[prop] = this.#tableOptions[prop];
                }
            }
        } else {
            options = this.#tableOptions;
        }

        let table = {columns: [], rows: [], options: {}};
        table.columns = columns;
        table.rows = rows;
        table.options = options;

        this.tables.push(this.#initTable(table));
    }

    #hasDuplicatedKeys = (columns) => {

        let temp = columns.map(item => item.key);
        return temp.some((item, idx) => temp.indexOf(item) !== idx);
    };

    #initTable = (table) => {

        for (let i = 0; i < table.rows.length; i++) {

            let maxRowheight = 10;
            let row = table.rows[i];
            for (let j = 0; j < table.columns.length; j++) {
                let column = table.columns[j];


                if (row.hasOwnProperty(column.key)) {
                    this.font(table.options.cellsFont, table.options.cellsFontSize);

                    let width = table.options.cellsMaxWidth + (table.options.cellsPadding * 2);

                    width = (this.widthOfString(row[column.key].toString()) < table.options.cellsMaxWidth) ?
                        this.widthOfString(row[column.key].toString()) + (table.options.cellsPadding * 2) :
                        table.options.cellsMaxWidth + (table.options.cellsPadding * 2);

                    let rowheight = this.heightOfString(row[column.key], {
                        width: width - (table.options.cellsPadding * 2),
                        align: column.align || table.options.cellsAlign
                    });

                    maxRowheight = (maxRowheight < rowheight) ? rowheight : maxRowheight;


                    table.rows[i]._rowHeight = maxRowheight + (table.options.cellsPadding * 2);

                    if (column.width === undefined || column.width === null || column.width < width) {
                        column.width = width;
                    }
                }

                this.font(table.options.cellsFont, table.options.cellsFontSize);
                let width = this.widthOfString(column.label) + table.options.cellsPadding;

                column.width = (column.width < width) ? width : column.width;

                table.columns[j] = column;
            }
        }

        table = (table.options.width === "fill_body") ? this.#fillParent(table) : table;

        return table;
    };

    #fillParent = (table) => {

        let tableWidth = 0;
        let blanks = 0;
        for (let i = 0; i < table.columns.length; i++) {
            tableWidth += (table.columns[i].width - (table.options.cellsPadding * 2));
            blanks += (table.options.cellsPadding * 2);
        }

        let bodywidth = this.#width - blanks - table.options.marginLeft - table.options.marginRight;

        if (tableWidth !== bodywidth) {


            for (let i = 0; i < table.rows.length; i++) {

                let maxRowheight = table.rows[i]._rowHeight - (table.options.cellsPadding * 2);
                let row = table.rows[i];
                for (let j = 0; j < table.columns.length; j++) {
                    let column = table.columns[j];

                    if (row.hasOwnProperty(column.key)) {

                        this.font(table.options.cellsFont, table.options.cellsFontSize);

                        if (i === 0)
                            column.width = (((column.width - (table.options.cellsPadding * 2)) / tableWidth) * bodywidth) + (table.options.cellsPadding * 2);

                        let rowheight = maxRowheight;
                        rowheight = this.heightOfString(row[column.key]);

                        maxRowheight = (maxRowheight < rowheight) ? rowheight : maxRowheight;
                    }
                    if (i === 0)
                        table.columns[j] = column;
                }

                table.rows[i]._rowHeight = maxRowheight + (table.options.cellsPadding * 2);
            }
        }
        return table;
    };

    #renderColumns = (table, x, y) => {
        this.font(table.options.headFont, table.options.headFontSize);

        if (table.options.border != null)
            this.lineWidth(table.options.border.size);

        let height = table.options.headHeight + (table.options.cellsPadding * 2);

        for (let i = 0; i < table.columns.length; i++) {

            let headWidth = this.widthOfString(table.columns[i].label, {align: table.options.headAlign}) > table.options.cellsMaxWidth
                ? table.options.cellsMaxWidth
                : this.widthOfString(table.columns[i].label, {align: table.options.headAlign});

            if (!table.columns[i].width || table.columns[i].width < headWidth) {
                table.columns[i].width = headWidth + (table.options.cellsPadding * 2);
            }

            let column = table.columns[i];

            this.lineJoin('miter')
                .rect(x, y, column.width, height);

            (table.options.border != null) ?
                this.fillAndStroke(table.options.headBackground, table.options.border.color) :
                this.fill(table.options.headBackground);

            let tempx = x;
            if (table.options.headAlign === 'left')
                tempx = x + table.options.cellsPadding;
            else if (table.options.headAlign === 'right')
                tempx = x - table.options.cellsPadding;


            this.fillColor(table.options.headColor);

            let text_options = {
                width: column.width,
                align: table.options.headAlign
            };

            this.text(column.label, tempx, y + 0.5 * (height - this.heightOfString(column.label)), text_options);
            column.x = column.x || x;
            x += column.width;

            if (!table.columns[i].hasOwnProperty("x"))
                table.columns[i] = column;
        }

        return table;

    };

    render() {

        // write header/footer in first page
        let x = this.#margin.left, y = this.#margin.top;
        if (this.header.isVisible) {
            y += this.header.options.heightNumber;
            this.header.render();
        }

        (this.footer.isVisible) && this.footer.render();

        for (let i = 0; i < this.tables.length; i++) {

            x += this.tables[i].options.marginLeft;
            y = this.#renderTable(this.tables[i], x, y);
            x = this.#margin.left;
        }
    }

    #renderTable = (table, x, y) => {

        this.font(table.options.cellsFont, table.options.cellsFontSize);
        let colorindex = 0;

        for (let i = 0; i < table.rows.length; i++) {

            if (i === 0) {
                y = this.#autoPageAddForTable(table, x, y, false);
            }

            let row = table.rows[i];

            for (let j = 0; j < table.columns.length; j++) {
                let column = table.columns[j];

                if (table.options.striped || table.options.border != null) {

                    this.rect(column.x, y, column.width, table.rows[i]._rowHeight);
                }

                if (table.options.striped && table.options.border != null) {
                    this.fillAndStroke(table.options.stripedColors[colorindex], table.options.border.color);
                } else if (table.options.striped && table.options.border == null) {
                    this.fill(table.options.stripedColors[colorindex]);
                } else if (!table.options.striped && table.options.border != null) {
                    this.stroke(table.options.border.color);
                }


                let tempx = column.x;
                if (!column.align || column.align === 'center' || column.align === 'left')
                    tempx = column.x + table.options.cellsPadding;

                this.fillColor(table.options.cellsColor);

                let text_options = {
                    width: column.width - ((column.align !== 'right') ? (table.options.cellsPadding * 2) : table.options.cellsPadding),
                    align: column.align || table.options.cellsAlign
                };
                this.text(row[column.key], tempx, y + 0.5 * (table.rows[i]._rowHeight - this.heightOfString(row[column.key], text_options)), text_options);

            }

            y += table.rows[i]._rowHeight;
            colorindex = colorindex === 0 ? 1 : 0;
            if (i < table.rows.length - 1) {
                y = this.#autoPageAddForTable(table, x, y, true);
            }
        }
        y += table.options.marginBottom;
        return y;
    };

    #autoPageAddForTable = (table, x, y, isLastRow) => {

        if (isLastRow === true && y >= this.#bodyheight - this.#margin.bottom - table.options.marginBottom) {

            let height = table.options.headHeight + (table.options.cellsPadding * 2);
            this.addPageDoc();
            y = this.#margin.top + (this.header.isVisible ? this.header.options.heightNumber : 0);
            this.#renderColumns(table, x, y);
            y += height;
            this.font(table.options.cellsFont, table.options.cellsFontSize);
        } else if (isLastRow === false) {

            if (y + (table.rows[0]._rowHeight) >= this.#bodyheight - this.#margin.bottom - table.options.marginTop) {
                this.addPageDoc();
                y = this.#margin.top + (this.header.isVisible ? this.header.options.heightNumber : 0);
            }
            let height = table.options.headHeight + (table.options.cellsPadding * 2);
            this.#renderColumns(table, x, y);
            y += height;
            this.font(table.options.cellsFont, table.options.cellsFontSize);
        }
        return y;
    };

    setPageNumbers(strTemplate = (current, count) => `${current} of ${count}`, position = "bottom", options = {}) {
        if (this.options.bufferPages) {

            let x, y;
            let validPositions = ["top", "bottom", "right", "left"];
            let pos = position.toString().split(" ");

            for (let i = 0; i < pos.length; i++) {

                if (!validPositions.includes(pos[i]))
                    throw new Error("Position given unknown ''" + pos[i] + "''");

                switch (pos[i]) {

                    case "top":
                        y = this.#margin.top / 2;
                        x = x || this.page.width / 2;
                        break;
                    case "bottom":
                        y = this.page.height - this.#margin.bottom;
                        x = x || this.page.width / 2;
                        break;
                    case "left":
                        x = this.#margin.left;
                        break;
                    case "right":
                        x = this.#width;
                        break;
                    default:
                        throw new Error("Invalid position value ''" + pos[i] + "''");
                }
            }


            let docRange = this.bufferedPageRange();
            // page numbers
            for (let i = docRange.start; i < docRange.count; i++) {

                let str = strTemplate((i + 1), docRange.count);
                let wstr = 0;

                if (position.includes("right"))
                    wstr = this.widthOfString(str, options);
                else if (position.includes("left"))
                    wstr = 0;
                else
                    wstr = this.widthOfString(str, options) / 2;


                this.switchToPage(i);
                this.fillColor('black');
                this.font("Helvetica", 10)
                    .text(str, x - wstr, y, options);
            }
        } else
            throw new Error("document option bufferPages needs to be set to true. 'new PdfkitConstruct({ bufferPages: true })'");
    }

}


module.exports = PdfkitConstruct;
