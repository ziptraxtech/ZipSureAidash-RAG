Python version used is 3.12.0

install the dependencies by setting virtual env

python -m venv venv
source venv/bin/activate

To install dependencies 
pip install -r requirements.txt


For the running the backend which is connected through fastapi

uvicorn backend.main:app --reload
(when application startup complete occurs then perform the following step.)


Start the app in a new terminal by reaching the directory using 
npm run dev

Then go to http://localhost:3000