const PDFDocument = require('pdfkit');

class PdfkitConstruct extends PDFDocument {

    // A4: [595.28, 841.89],

    #width = 0;
    #height = 0;
    #bodyheight = 0;

    #margin = {top: 10, left: 10, right: 10, bottom: 10};


    tables = [];

    tableOptions = {
        marginLeft: 0,
        marginRight: 0,
        marginTop: 0,
        marginBottom: 5,
        border: {size: .1, color: '#000'},
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

        this.#margin = this.options.margin ? {
            top: this.options.margin,
            left: this.options.margin,
            right: this.options.margin,
            bottom: this.options.margin
        } : this.#margin;

        this.#margin = this.options.margins ? this.options.margins : this.#margin;

        this.#width = this.page.width - (this.#margin.left + this.#margin.right);
        this.#height = this.page.height - (this.#margin.top + this.#margin.bottom);
        this.#bodyheight = this.#height;
    }

    setDocumentHeader(options, renderCallback) {

        if (!options)
            throw new Error("Header options are not set !");
        if (!renderCallback)
            throw new Error("Header rendering callback not set !");

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

        if (!options)
            throw new Error("Footer options are not set !");
        if (!renderCallback)
            throw new Error("Footer rendering callback not set !");

        if (options) {
            for (let prop in options) {
                this.footer.options[prop] = options[prop];
            }
        }

        if (typeof this.footer.options.height == "number") {
            this.footer.options.heightNumber = this.footer.options.height;
        } else if (typeof this.footer.options.height == "string") {
            let percentageHeight = Number(this.footer.options.height.replace("%", ""));

            if (isNaN(percentageHeight))
                throw new Error("Invalid Footer height percentage !");

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
        this.addPage(this.options);

        if (this.header.isVisible) {
            this.header.render();
        }

        if (this.footer.isVisible) {
            this.footer.render();
        }
    }


    // column : key | label
    // row : object (property name is the column key)
    addTable(columns, rows, options = null) {

        if (!columns || columns.length === 0)
            throw new Error("Columns are not set !");
        if (!rows || rows.length === 0)
            throw new Error("rows are not set !");

        if (options) {
            for (let prop in this.tableOptions) {
                if (!options.hasOwnProperty(prop)) {
                    options[prop] = this.tableOptions[prop];
                }
            }
        } else {
            options = this.tableOptions;
        }

        this.tables.push(this.#initTable({columns: columns, rows: rows, options: options}));
    }

    #initTable = (table) => {

        for (let i = 0; i < table.rows.length; i++) {

            let maxRowheight = 10 + (table.options.cellsPadding * 2);
            let row = table.rows[i];
            for (let j = 0; j < table.columns.length; j++) {
                let column = table.columns[j];

                for (const prop in row) {
                    if (prop === column.key) {

                        this.font(table.options.cellsFont, table.options.cellsFontSize);

                        let width = table.options.cellsMaxWidth + (table.options.cellsPadding * 2);

                        let rowheight = maxRowheight;

                        if (this.widthOfString(row[prop].toString()) <= table.options.cellsMaxWidth) {
                            width = this.widthOfString(row[prop].toString()) + (table.options.cellsPadding * 2);
                        } else {
                            width = table.options.cellsMaxWidth + (table.options.cellsPadding * 2);
                            rowheight = this.heightOfString(row[prop], {width: width}) + (table.options.cellsPadding * 2);
                        }


                        if (maxRowheight < rowheight)
                            maxRowheight = rowheight;

                        if (column.width === undefined || column.width === null || column.width < width) {
                            column.width = width;
                        }
                        break;
                    }
                }

                this.font(table.options.cellsFont, table.options.cellsFontSize);
                let width = this.widthOfString(column.label) + table.options.cellsPadding;

                if (column.width < width)
                    column.width = width;

                table.columns[j] = column;
            }

            table.rows[i].___pdfConstructTableRowHeight = maxRowheight + table.options.cellsPadding;
        }

        return table;
    };

    getColumnByKey(columns, key) {
        for (let i = 0; i < columns.length; i++) {

            if (columns[i].key === key)
                return columns[i];
        }
        return null;
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
                table.columns[i].width = headWidth + (table.options.cellsPadding);
            }

            let column = table.columns[i];

            this.lineJoin('miter')
                .rect(x, y, column.width, height);

            if (table.options.border != null)
                this.fillAndStroke(table.options.headBackground, table.options.border.color);
            else
                this.fill(table.options.headBackground);

            let tempx = x;
            if (table.options.headAlign === 'left')
                tempx = x + table.options.cellsPadding;
            else if (table.options.headAlign === 'right')
                tempx = x - table.options.cellsPadding;


            this.fillColor(table.options.headColor);

            let text_options = {
                width: column.width,
                height: table.options.headHeight,
                align: table.options.headAlign
            };

            this.text(column.label, tempx, y + 0.5 * (height - this.heightOfString(column.label, text_options)), text_options);
            column.x = column.x ? column.x : x;
            x += column.width;

            if (!table.columns[i].hasOwnProperty("x"))
                table.columns[i] = column;
        }

        console.log(table.columns[0]);

        return table;

    };

    render() {

        // write header/footer in first page
        let x = this.#margin.left, y = this.#margin.top;
        if (this.header.isVisible) {
            y += this.header.options.heightNumber;
            this.header.render();
        }

        if (this.footer.isVisible)
            this.footer.render();


        for (let i = 0; i < this.tables.length; i++) {

            /*if (y + this.tables[i].options.marginTop >= this.#bodyheight + this.#margin.bottom) {
                this.addPageDoc();
                y = this.#margin.top + (this.header.isVisible ? this.header.options.heightNumber : 0);
            }*/
            x += this.tables[i].options.marginLeft;
            y = this.#renderTable(this.tables[i], x, y);
            x = this.#margin.left;
        }
    }

    #renderTable = (table, x, y) => {

        y = this.#autoPageAddForTable(table, x, y, false);
        y += table.options.marginTop;

        this.font(table.options.cellsFont, table.options.cellsFontSize);
        let colorindex = 0;

        for (let i = 0; i < table.rows.length; i++) {
            let row = table.rows[i];
            for (let prop in row) {
                let column = this.getColumnByKey(table.columns, prop);
                if (column) {

                    if (table.options.striped || table.options.border != null) {

                        this.lineJoin('miter')
                            .rect(column.x, y, column.width, table.rows[i].___pdfConstructTableRowHeight);
                    }

                    if (table.options.striped && table.options.border != null) {
                        this.fillAndStroke(table.options.stripedColors[colorindex], table.options.border.color);
                    } else if (table.options.striped && table.options.border == null) {
                        this.fill(table.options.stripedColors[colorindex]);
                    } else if (!table.options.striped && table.options.border != null) {
                        this.stroke(table.options.border.color);
                    }


                    let tempx = column.x;
                    if (column.align === 'left')
                        tempx = column.x + table.options.cellsPadding;
                    else if (!column.align || column.align === 'center')
                        tempx = column.x + table.options.cellsPadding / 2;

                    this.fillColor(table.options.cellsColor);

                    let text_options = {
                        width: column.width - table.options.cellsPadding,
                        align: column.align ? column.align : table.options.cellsAlign
                    };
                    this.text(row[prop], tempx, y + 0.5 * (table.rows[i].___pdfConstructTableRowHeight - this.heightOfString(row[prop], text_options)), text_options);

                }
            }

            y += table.rows[i].___pdfConstructTableRowHeight;
            colorindex = colorindex === 0 ? 1 : 0;
            if (i < table.rows.length - 1) {
                y = this.#autoPageAddForTable(table, x, y, true);
            }
        }
        y += table.options.marginBottom;
        return y;
    };

    #autoPageAddForTable = (table, x, y, checkEnd) => {

        if (checkEnd === true && y >= this.#bodyheight - this.#margin.bottom - table.options.marginBottom) {

            let height = table.options.headHeight + (table.options.cellsPadding * 2);
            this.addPageDoc();
            y = this.#margin.top + (this.header.isVisible ? this.header.options.heightNumber : 0);
            this.#renderColumns(table, x, y);
            y += height;
            this.font(table.options.cellsFont, table.options.cellsFontSize);
        } else if (checkEnd === false) {
            let height = table.options.headHeight + (table.options.cellsPadding * 2);
            this.#renderColumns(table, x, y);
            y += height;
            this.font(table.options.cellsFont, table.options.cellsFontSize);
        }
        return y;
    };

    setPageNumbers(strTemplate = (current, count) => `${current} of ${count}`, position = "top" | "bottom" | "top right" | "top left" | "bottom right" | "bottom left") {
        if (this.options.bufferPages) {
            let x, y;

            switch (position) {

                case "top":
                    y = this.#margin.top / 2;
                    x = this.page.width / 2;
                    break;
                case "top left":
                    y = this.#margin.top / 2;
                    x = this.#margin.left / 2;
                    break;
                case "top right":
                    y = this.#margin.top / 2;
                    x = this.#width;
                    break;
                case "bottom":
                    y = this.#height;
                    x = this.page.width / 2;
                    break;
                case "bottom left":
                    y = this.#height;
                    x = this.#margin.left;
                    break;
                case "bottom right":
                default:
                    y = this.#height;
                    x = this.#width;
                    break;

            }

            let docRange = this.bufferedPageRange();
            // page numbers
            for (let i = docRange.start; i < docRange.count; i++) {
                this.switchToPage(i);
                this.fillColor('black');
                this.font("Helvetica", 10)
                    .text(strTemplate((i + 1), docRange.count), x, y, {lineBreak: false});
            }
        } else
            throw new Error("document option bufferPages needs to be set to true. 'new PdfkitConstruct({ bufferPages: true })'");
    }

}


module.exports = PdfkitConstruct;
