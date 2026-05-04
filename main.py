from fastapi import FastAPI, File, Form, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from controlador.ControladorAPI import ControladorAPI
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Se puede cambiar esto según el despliegue, como allow_origins=["https://tu-dominio.com"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Sirve archivos estáticos
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/", response_class=HTMLResponse)
async def read_root():
    return FileResponse("templates/index.html")

@app.get("/api-docs.html", response_class=HTMLResponse)
async def get_api_docs():
    return FileResponse("templates/api-docs.html")

@app.post("/sumarizer")
async def sumarizer(
    archivo_pdf: UploadFile = File(...),
    temperature: float = Form(default=0.3),
    top_p: float = Form(default=0.6),
    repeat_penalty: float = Form(default=1.1),
    repeat_last_n: float = Form(default=64),
    num_predict: int = Form(default=250),
):
    if not archivo_pdf.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="El archivo debe ser un PDF.")

    ruta_archivo = f"temporal_{archivo_pdf.filename}"
    with open(ruta_archivo, "wb") as f:
        f.write(await archivo_pdf.read())
    
    options_dict = {
        "temperature": temperature,
        "top_p": top_p,
        "repeat_penalty": repeat_penalty,
        "repeat_last_n": repeat_last_n,
        "num_predict": num_predict
    }

    try:
        controlador = ControladorAPI(ruta_archivo, options_dict)
        respuesta = controlador.controladorPOST({"archivo_pdf": ruta_archivo})

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        os.remove(ruta_archivo)

    return respuesta
