from fastapi import FastAPI, Depends, HTTPException, status, Body
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from starlette.requests import Request
import secrets
import requests
from fastapi.responses import RedirectResponse
from fastapi import Form
import json


app = FastAPI()
print("started")
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

security = HTTPBasic()

# Для простоты, используем жестко заданные логин и пароль.
# В реальной жизни вы должны использовать хеширование паролей и базу данных.
users = {"user": "password"}

def verify_password(credentials: HTTPBasicCredentials = Depends(security)):
    correct_password = users.get(credentials.username)
    if not correct_password or not secrets.compare_digest(correct_password, credentials.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Basic"},
        )
    return credentials

@app.get("/", response_class=HTMLResponse)
async def login(request: Request):
    response = RedirectResponse(url="/chats/", status_code=303)
    return response

@app.get("/logout/")
def logout():
    response = RedirectResponse(url="/", status_code=303)
    # Здесь вы можете добавить дополнительную логику для удаления учетных данных, если это необходимо
    return response

@app.get("/chats/", response_class=HTMLResponse)
async def chats(request: Request, credentials: HTTPBasicCredentials = Depends(verify_password)):
    return templates.TemplateResponse("chats2.html", {"request": request})

@app.get("/stat/", response_class=HTMLResponse)
async def stats(request: Request, credentials: HTTPBasicCredentials = Depends(verify_password)):
    return templates.TemplateResponse("stat.html", {"request": request})

@app.post("/proxy_send_message/")
async def proxy_post(data: dict = Body(...)):
    print(data)
    response = requests.post(url="http://malone_millionaire_app:4080/api/v1/send_message_text", data=json.dumps(data), headers={"Content-type":"application/json"})
    print(response.json())
    return response.json()

@app.get("/proxy_all_users/")
async def proxy_all_users():
    response = requests.get(url="http://malone_millionaire_app:4080/api/v1/all_users")
    return response.json()

@app.get("/proxy_all_steps/")
async def proxy_all_steps():
    response = requests.get(url="http://malone_millionaire_app:4080/api/v1/all_step_stats")
    return response.json()

@app.post("/send_broadcast/")
async def send_broadcast(data: dict = Body(...)):
    response = requests.post(
        url="http://malone_millionaire_app:4080/api/v1/send_message_text_by_step",
        json=data,
        headers={"Content-Type": "application/json"}
    )
    return response.json()
    
@app.post("/login/")
async def login_post(request: Request, username: str = Form(...), password: str = Form(...)):
    correct_password = users.get(username)
    if not correct_password or not secrets.compare_digest(correct_password, password):
        return templates.TemplateResponse("login.html", {"request": request, "error": "Неверное имя пользователя или пароль"})
    response = RedirectResponse(url="/chats/", status_code=200)
    return response


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
