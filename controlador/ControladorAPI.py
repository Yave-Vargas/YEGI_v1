from .ExtraerPDF import ExtraerPDF
from .PreprocesadorTexto import PreprocesadorTexto
from .ControladorMLL import ControladorMLL
from .GenerarJSON import GenerarJSON
from .ValidadorErroresWarning import ValidadorErroresWarning

class ControladorAPI:
    def __init__(self, archivo_pdf: str, options_dict: dict):
        self.archivo_pdf = archivo_pdf
        self.texto_extraido = ""
        self.texto_limpio = ""
        self.resumen = ""
        self.warnings = {}
        self.respuesta = {}
        self.options = options_dict

    def validar_pdf_POST(self, archivo_pdf: str) -> bool:
        return archivo_pdf.lower().endswith(".pdf")

    def controladorPOST(self, peticion: dict) -> dict:
        archivo = peticion.get("archivo_pdf", "")

        if not self.validar_pdf_POST(archivo):
            validador = ValidadorErroresWarning()
            return validador.mostrar_error("Archivo inválido. Solo se permiten archivos PDF.")

        try:
            extraedor = ExtraerPDF(archivo)
            self.texto_extraido = extraedor.extraer_texto()
        except Exception as e:
            validador = ValidadorErroresWarning()
            return validador.mostrar_error(f"Error al extraer texto del PDF: {str(e)}")

        preprocesador = PreprocesadorTexto(self.texto_extraido)
        preprocesador.eliminar_margenes()
        preprocesador.eliminar_secciones()
        preprocesador.eliminar_menciones()
        preprocesador.crear_parrafos()
        preprocesador.poner_minusculas()
        self.texto_limpio = preprocesador.texto_limpio

        validador = ValidadorErroresWarning()
        validador.revisar_warnings(preprocesador.warnings)
        self.warnings = preprocesador.warnings

        controlador_mll = ControladorMLL(self.texto_limpio, options=self.options)
        resultado_mll = controlador_mll.inferencia_MLL()

        if resultado_mll.get("mensaje") == "Error":
            return validador.mostrar_error(resultado_mll.get("error"))

        self.resumen = resultado_mll.get("resumen", "")

        generador = GenerarJSON(self.resumen)
        self.respuesta = generador.generar_json()
        self.respuesta["warnings"] = self.warnings

        return self.respuesta
