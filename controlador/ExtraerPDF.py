import fitz # PyMuPDF: pip install pymupdf

class ExtraerPDF:
    def __init__(self, archivo_pdf: str):
        self.archivo_pdf = archivo_pdf

    def validar_formato(self) -> bool:
        """
        Valida que el archivo tenga extensión .pdf.
        """
        return self.archivo_pdf.lower().endswith('.pdf')

    def extraer_texto(self) -> str:
        """
        Extrae y retorna el contenido textual del PDF
        """
        # Errores por archivo
        if not self.validar_formato():
            raise ValueError("El archivo no tiene un formato PDF válido.")
        try:
            doc = fitz.open(self.archivo_pdf)
        except fitz.FileDataError:
            raise ValueError(f"El archivo '{self.archivo_pdf}' está corrupto, vacío o no es un PDF válido.")
        except Exception as e:
            raise ValueError(f"No se pudo abrir el archivo '{self.archivo_pdf}'. Error: {e}")
        textos = []

        for pagina in doc:
            # Convertir las coordenadas de tablas a objetos Rect
            tablas = pagina.find_tables()
            rectangulos_tablas = [fitz.Rect(tabla.bbox) for tabla in tablas]
            # Obtener coordenadas
            bloques = pagina.get_text("blocks")
            
            texto_filtrado = []
            for bloque in bloques:
                # Coordenadas de tablas en variables
                x0, y0, x1, y1, texto, _, tipo_bloque = bloque
                # bloque de coordenadas de tablas
                rectangulo_bloque = fitz.Rect(x0, y0, x1, y1)
                
                # Verificar si esta en tabla el texto
                en_tabla = any(rect_tabla.contains(rectangulo_bloque) for rect_tabla in rectangulos_tablas)
                
                # Si no esta en tabla se extrae el texto normalmente 
                if not en_tabla and tipo_bloque == 0:
                    texto_filtrado.append(texto.strip())
            
            textos.append("\n".join(texto_filtrado).strip())

        texto_final = "\n".join(textos).strip()
        if not texto_final:
            raise ValueError(f"El archivo '{self.archivo_pdf}' no contiene texto extraíble.")

        return "\n".join(textos)