import ollama

class ControladorMLL:
    def __init__(self, texto_limpio: str = "", options: dict = None):
        self.texto_limpio = texto_limpio
        self.resumen = ""
        self.options = options

    def validar_conexion(self) -> bool | dict:
        """
        Verifica si el modelo 'llama3.2:3b' está disponible en Ollama.
        Retorna True si está disponible, o un diccionario con mensaje de error si no lo está.
        """
        try:
            modelos = ollama.list()
            #print(modelos)
            nombres_modelos = [m.model for m in modelos.models]  # Accede al atributo 'model' directamente
            if any(nombre == "llama3.2:3b" for nombre in nombres_modelos):
                return True
            else:
                return {
                    "mensaje": "Error",
                    "error": "Error al generar el resumen: modelo 'llama3.2:3b' no disponible"
                }
        except Exception as e:
            return {
                "mensaje": "Error",
                "error": f"Error al conectar con Ollama: {str(e)}"
            }

    def inferencia_MLL(self) -> dict:
        """
        Usa el modelo LLaMA 3.2:3b para generar un resumen.
        Verifica previamente que el modelo esté disponible.
        """
        # Verificar disponibilidad del modelo
        verificacion = self.validar_conexion()
        if verificacion is not True:
            return verificacion

        try:
            num_predict_palabras = self.options['num_predict']

            prompt_sistema = (
                f"Eres un modelo especializado en la generación de resúmenes científicos en español. "
                f"Dado el contenido completo de un artículo académico, tu tarea es generar un resumen informativo, "
                f"conciso y autónomo que:\n"
                f"El resumen tiene que tener como máximo una extensión de {num_predict_palabras} palabras.\n"
                f"1. Sea claro, coherente.\n"
                f"2. Use un lenguaje técnico, pero comprensible para no expertos en el tema y con escritura en tercera persona.\n"
                f"3. Incluya los siguientes elementos clave:\n"
                f"   - El problema o motivación de la investigación.\n"
                f"   - La metodología utilizada.\n"
                f"   - Los principales resultados obtenidos.\n"
                f"   - Las conclusiones y aportes al campo de estudio.\n\n"
                f"El resumen no debe incluir información que no esté presente en el artículo, ni opiniones externas, ni juicios personales. "
                f"Además, debe ser comprensible sin necesidad de consultar el documento completo y facilitar la recuperación mediante "
                f"el uso natural de palabras clave.\n\n"
                f"Toma en cuenta que el resumen debe funcionar como una visualización general del artículo completo, "
                f"permitiendo al lector decidir si el contenido es relevante para sus intereses."
            )

            response = ollama.chat(
                model="llama3.2:3b",
                messages=[
                    {"role": "system", "content": prompt_sistema},
                    {"role": "user", "content": self.texto_limpio}
                ],
                options=self.options
            )

            self.resumen = response['message']['content']
            return {
                "mensaje": "Resumen generado exitosamente.",
                "resumen": self.resumen
            }
        except Exception as e:
            return {
                "mensaje": "Error",
                "error": f"Error al generar el resumen: {str(e)}"
            }
