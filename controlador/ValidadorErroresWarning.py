class ValidadorErroresWarning:
    def __init__(self):
        # Diccionario que almacena el estado de cada sección.
        self.warnings = {}
        #self.warnings: dict[str, int] = {}

    def mostrar_error(self, mensaje: str) -> dict:
        """
        Genera un diccionario de error con un mensaje dado y un resumen vacío.
        """
        return{
                "mensaje": "Error",
                "error": mensaje
            }
    
    def mostrar_warning(self, warning: str) -> None:
        """
        Muestra un warning internamente.
        """
        print(f"Warning: {warning}")
        
    def revisar_warnings(self, warnings: dict) -> None:
        """
        Revisa el diccionario de warnings y muestra un warning para cada elemento no identificado (valor 0).
        Los warnings es un diccionario con las secciones y su estado (0: no identificado, 1: identificado).
        """
        for indice, valor in warnings.items():
            if valor == 0:
                # Se invoca mostrar_warning para cada sección.
                self.mostrar_warning(f"No se encontró '{indice}'")
