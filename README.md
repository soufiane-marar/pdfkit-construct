# Pdfkit-Construct

_PdfkitConstruct_ is a [pdfkit](https://www.npmjs.com/package/pdfkit) library for simplifying the creation of tables.

_PdfkitConstruct_ is a **subclass** of _PDFDocument_ 
 
## Installation

Use the npm package manager to install 

pdfkit-construct depends on [pdfkit](https://www.npmjs.com/package/pdfkit)

```bash
npm install pdfkit
```

```bash
npm install pdfkit-construct
```

## Simple example usage

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

            const doc = new PdfkitConstruct({
                size: 'A4',
                margins: {top: 20, left: 50, right: 50, bottom: 20},
                bufferPages: true,
            });

            doc.setDocumentHeader({}, () => {


                doc.lineJoin('miter')
                    .rect(0, 0, doc.page.width, doc.header.options.heightNumber).fill("#ededed");

                doc.fill("#115dc8")
                    .fontSize(20)
                    .text("Hello world header", doc.header.x, doc.header.y);
            });

            doc.setDocumentFooter({}, () => {

                doc.lineJoin('miter')
                    .rect(0, doc.footer.y, doc.page.width, doc.footer.options.heightNumber).fill("#c2edbe");

                doc.fill("#7416c8")
                    .fontSize(8)
                    .text("Hello world footer", doc.footer.x, doc.footer.y + 10);
            });


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
                    striped: true,
                    stripedColors: ["#f6f6f6", "#d6c4dd"],
                    cellsPadding: 20,
                    marginLeft: 10,
                    headAlign: 'center'
                });


            doc.render();

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

```

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.
