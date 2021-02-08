# Pdfkit-Construct
_PdfkitConstruct_ is a [pdfkit](https://www.npmjs.com/package/pdfkit) helper for simplifying the creation of tables.

## Getting Started
#### Prerequisites
_pdfkit-construct depends on [pdfkit](https://www.npmjs.com/package/pdfkit)_ package, make sure its installed.

```bash
npm install pdfkit
```

## Installing
Installation uses the npm package manager. Just type the following command after installing npm.

```bash
npm install pdfkit-construct
```



## Usage

``` javascript
const PdfkitConstruct = require('pdfkit-construct');
const app = require('express')();


app.get("/", (req, res) => {

    getDbData()
        .then(products => {

            for (let i = 0; i < products.length; i++) {
                products[i].amount = (products[i].price * products[i].quantity).toFixed(2);
                products[i].price = products[i].price.toFixed(2);
            }

            // Create a document
            const doc = new PdfkitConstruct({
                size: 'A4',
                margins: {top: 20, left: 10, right: 10, bottom: 20},
                bufferPages: true,
            });

            // set the header to render in every page
            doc.setDocumentHeader({}, () => {


                doc.lineJoin('miter')
                    .rect(0, 0, doc.page.width, doc.header.options.heightNumber).fill("#ededed");

                doc.fill("#115dc8")
                    .fontSize(20)
                    .text("Hello world header", doc.header.x, doc.header.y);
            });

            // set the footer to render in every page
            doc.setDocumentFooter({}, () => {

                doc.lineJoin('miter')
                    .rect(0, doc.footer.y, doc.page.width, doc.footer.options.heightNumber).fill("#c2edbe");

                doc.fill("#7416c8")
                    .fontSize(8)
                    .text("Hello world footer", doc.footer.x, doc.footer.y + 10);
            });


            // add a table (you can add multiple tables with different columns)
            // make sure every column has a key. keys should be unique
            doc.addTable(
                [
                    {key: 'name', label: 'Product', align: 'left'},
                    {key: 'brand', label: 'Brand', align: 'left'},
                    {key: 'price', label: 'Price', align: 'right'},
                    {key: 'quantity', label: 'Quantity'},
                    {key: 'amount', label: 'Amount', align: 'right'}
                ],
                products, {
                    border: null,
                    width: "fill_body",
                    striped: true,
                    stripedColors: ["#f6f6f6", "#d6c4dd"],
                    cellsPadding: 10,
                    marginLeft: 45,
                    marginRight: 45,
                    headAlign: 'center'
                });


            // render tables
            doc.render();

            // this should be the last
            // for this to work you need to set bufferPages to true in constructor options 
            doc.setPageNumbers((p, c) => `Page ${p} of ${c}`, "bottom right");

            doc.pipe(res);
            doc.end();
        })
        .catch(error => {
            res.status(200).send(error.stack);
        })
});

function getDbData() {

    return new Promise((resolve, reject) => {
        resolve([
            {
                "id": 7631,
                "SKU": "HEH-9133",
                "name": "On Cloud Nine Pillow On Cloud Nine Pillow On Cloud Nine Pillow On Cloud Nine Pillow",
                "price": 24.99,
                "brand": "FabDecor",
                "quantity": 1,
                "created_at": "2018-03-03 17:41:13"
            },
            {
                "id": 7615,
                "SKU": "HEH-2245",
                "name": "Simply Sweet Blouse",
                "price": 42,
                "brand": "Entity Apparel",
                "quantity": 2,
                "created_at": "2018-03-20 22:24:21"
            },
            {
                "id": 8100,
                "SKU": "WKS-6016",
                "name": "Uptown Girl Blouse",
                "price": 58,
                "brand": "Entity Apparel",
                "quantity": 3,
                "created_at": "2018-03-16 21:55:28"
            }]);
    })
}

let port = process.env.PORT || 3330;
app.listen(port, () => console.log(`Server listening on port ${port}...`));

```

## Api

If you are not familiar with [PDFKIT](https://www.npmjs.com/package/pdfkit) package please consider checking this [website](http://pdfkit.org/).

- #### addTable
  - `columns` : array of column object
    - **key** (string & unique & not null)
    - **label** (string)
    - **align** 'left' | 'right' | 'center'. [default : 'left']
  - `rows` : array of objects with properties name matching the value set in columns key
  - `options` : table general options
    - **width** : "auto", // auto | fill_body
    - **marginLeft** : 0,
    - **marginRight** : 0,
    - **marginTop** : 0,
    - **marginBottom** : 5,
    - **border** : {size: 0.1, color: '#cdcdcd'},
    - **striped** : false,
    - **stripedColors** : ['#fff', '#f0ecd5'],
    - **headBackground** : '#abc6f0',
    - **headAlign** : 'center' // left | right | center,
    - **headColor** : '#000',
    - **headFont** : "Helvetica-Bold",
    - **headFontSize** : 10,
    - **headHeight** : 10,
    - **cellsFont** : "Helvetica",
    - **cellsFontSize** : 9,
    - **cellsAlign** : 'center' // left | right | center,
    - **cellsColor** : "#000",
    - **cellsPadding** : 5,
    - **cellsMaxWidth** : 120

_`NOTE THAT YOU CAN ADD MULTIPLE TABLES !`_

- #### setDocumentHeader
  - `options`
    - **height** : "10%" // accepts only percentage
  - `renderer` // callback function
  
- #### setDocumentFooter
  - `options`
    - **height** : "5%" // accepts only percentage
  - `renderer` // callback function
  
- #### addPageDoc
    Adds a page with header / footer rendered if they are set.
    
- #### render
    Call this to render tables
    
- #### setPageNumbers
  - ``templateRenderer = (p, count) => `${current} of ${count}` `` // function, returns string
    - **p** (current page)
    - **count** (number of pages in the doc)
  - `position = "bottom"` // accepts values : "top","top left","top right","bottom","bottom left","bottom right"

_`CALL THIS AFTER FINISHING ALL THE RENDERING!`_

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License
This project is licensed under the [MIT License](LICENSE).
