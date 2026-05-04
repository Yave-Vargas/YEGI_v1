class GenerarJSON:
    def __init__(self, resumen: str):
        self.resumen = resumen
        """
        Se asigna un mensaje
        Un mensaje de exito con un resumen válido, es decir, no vacío
        Un mensaje de de error en el caso contrario.
        """
        if resumen:
            self.mensaje = "El resumen fue generado correctamente."
        else:
            self.mensaje = "Error: No fue posible generar el resumen."

    def generar_json(self) -> dict:
        """
        Genera un diccionario (JSON) con el resumen y el mensaje.
        """
        return {"resumen": self.resumen, "mensaje": self.mensaje}