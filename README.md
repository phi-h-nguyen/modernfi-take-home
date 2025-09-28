# ModernFi Take Home Assessment

Full stack application built in Typescript/React and Python/Flask. Order management and treasury yield curve charting.

### Features

#### Yield Curve Chart
<img src="https://github.com/user-attachments/assets/bf0d0fbb-38e6-4369-a885-46142891c7f5" width="600">

#### Order Form
<img src="https://github.com/user-attachments/assets/0e42804a-2aaf-4ad9-b6e2-f5cd035cda5a" width="600">

- Uses current day's yield data for each instrument

#### Order Submission
<img src="https://github.com/user-attachments/assets/b5e69e9c-927a-4644-84f2-6697b27f54f1" width="600">

- React Query used to automatically refresh order blotter to see new orders

#### Order Blotter
<img src="https://github.com/user-attachments/assets/0fffc695-4b08-4e5c-a5a3-7637836e0abb" width="600">



## Front-end
#### Installation & Running
- Installation: `npm i`
- Run: `npm run dev`

#### Libraries
- [antd](https://ant.design/): components
- [stitches](https://stitches.dev/): styling
- [react-query](https://tanstack.com/query/latest): data fetching
- [react hook form](https://react-hook-form.com/): form management
- [recharts](https://recharts.org/en-US): charting

## Backend
#### Installation & Running
- Download [pipenv](https://pipenv.pypa.io/en/latest/installation.html)
- Installation: `pipenv install`
- Run: `pipenv run start`

#### Libraries
- [flask](https://flask.palletsprojects.com/en/stable/) for web backend
- [sqlite](https://flask.palletsprojects.com/en/stable/patterns/sqlite3/) for database (automatically initialized on startup with data persisted in `backend/orders.db`)

#### API
- `GET` `/api/yields/treasury?date=<date>`: Request treasury yield data for a specific date. Will use latest previously available date (ie if requesting a weekend date, will return the last Friday's yield data). Uses LRU caching to minimize requests to `treasury.gov`.
- `GET` `/api/orders`: Request all orders data in DB, ordered by creation date. Returns `order_id` of new order if successful.
- `POST` `/api/orders`: Adds new order to DB with data validation.
