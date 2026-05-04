import re

class PreprocesadorTexto:
    def __init__(self, texto_extraido: str):
        self.warnings = {
            'laterales': 0,
            'resumen o abstract': 0,
            'referencias o bibliografia': 0,
            'no_pagina': 0,
        }
        self.texto_limpio = texto_extraido

    def poner_minusculas(self) -> None:
        """
        Convierte todo el texto a minúsculas.
        """
        self.texto_limpio = self.texto_limpio.lower()

    def eliminar_secciones(self) -> None:
        """
        Elimina secciones correspondientes a 'Resumen', 'Abstract' y 'Referencias' si es que encuentra.
        """
        texto = self.texto_limpio  # Usamos el texto original extraído
        
        # Buscar la posición de "introducción" (acepta variantes)
        intro_match = re.search(r'\bintroducci[oó]n\b\s*\n', texto, flags=re.IGNORECASE)

        inicio = 0
        if intro_match:
            inicio = intro_match.start()

        # Verificar existencia de 'resumen' o 'abstract' para los warnings
        if re.search(r'(resumen)\s*[:\n]', texto, flags=re.IGNORECASE) or re.search(r'(abstract)\s*[:\n]', texto, flags=re.IGNORECASE):
            self.warnings['resumen o abstract'] = 1

        # Eliminar todo lo anterior a introducción (Encabezados, portadas, etc)
        texto = texto[inicio:]

        # Buscar y eliminar todo lo que esté después de "referencias" o "bibliografía" junto a un estilo de referencias ya sea de APA o IEEE para no borrar partes erroneas.
        referencias_match = re.search(r'\n\s*(referencias\s+bibliográficas|referencias|bibliograf[íi]a)\s*\n\s*(?:\[\d+(?:,\s*\d+)*(-\d+)?\]|.*\(\d{4}[^\)]*\))', texto, flags=re.IGNORECASE)
        if referencias_match:
            texto = texto[:referencias_match.start()]
            # Actuliza warnings
            self.warnings['referencias o bibliografia'] = 1
        else:
            # Busca y eliminar la sección que no sigue totalmente el estandar de referencias o bibliografía en el texto pero tiene elementos que pertenecen a referencias
            referencias_match = re.search(
                r'\n\s*(referencias|bibliograf[íi]a)\b.*?(?=\n\s*(?:\[\d+\]|https?://|doi\.org|\w+,\s*\w+\.|\(\d{4}\)|\Z))',
                texto,
                flags=re.IGNORECASE | re.DOTALL
            )
            if referencias_match:
                texto = texto[:referencias_match.start()]
                # Actuliza warnings
                self.warnings['referencias o bibliografia'] = 1
            else:
                # Busca encabezados de referencias o bibliografía (con o sin numeración/arreglo), incluyendo variantes con números decimales y romanos y elimina todo.
                referencias_match = re.search(r'\n\s*(?:\d+\s*[-\.]\s*)?(?:[ivx]+\.\s*)?(?:referencias(?:\s+bibliográficas)?|bibliograf[íi]a)\b[^\S\n]*\n[\s\S]*$', texto, flags=re.IGNORECASE)
                if referencias_match:
                    texto = texto[:referencias_match.start()]
                    self.warnings['referencias o bibliografia'] = 1


        
        self.texto_limpio = texto.strip()  # Guardar texto limpio sin las secciones 

    def eliminar_margenes(self) -> None:
        """
        Elimina párrafos repetitivos (encabezados, pies de página) y números de página aislados.
        Principalmente detecta lineas repetitivas. 
        Marca los warnings correspondientes.
        """
        lineas = self.texto_limpio.split('\n')
        frecuencia_lineas = {}
        
        # Contar frecuencia de cada línea 'normalizada' (omitiendo vacías)
        for linea in lineas:
            linea_sola = linea.strip()
            if linea_sola:
                # Normalizar: quitar números, normalizar espacios y poner minúsculas
                linea_norm = re.sub(r'\s+', ' ', re.sub(r'\d+', '', linea_sola)).strip().lower()
                frecuencia_lineas[linea_norm] = frecuencia_lineas.get(linea_norm, 0) + 1

        lineas_filtradas = []

        for linea in lineas:
            linea_sola = linea.strip()
            if not linea_sola:
                continue  # Omitir lineas vacías

            # Detectar y eliminar números aislados (principalmente el número de página)
            if re.fullmatch(r'\d+', linea_sola):
                # Actualizar warnings
                self.warnings['no_pagina'] = 1
                # Saltar linea
                continue

            # Normalizar linea
            linea_norm = re.sub(r'\s+', ' ', re.sub(r'\d+', '', linea_sola)).strip().lower()

            # Eliminar si la versión normalizada aparece más de una vez (Las lineas repetitivas regularmente son encabezados, pies de paginas o laterales)
            if frecuencia_lineas.get(linea_norm, 0) > 1:
                # Actualizar warnings
                self.warnings['laterales'] = 1
                # Saltar linea
                continue

            # Conservar si pasa los filtros
            lineas_filtradas.append(linea)
        
        # Actualizar el texto limpio
        self.texto_limpio = '\n'.join(lineas_filtradas).strip()

    def eliminar_menciones(self) -> None:
        """
        Elimina menciones a referencias (por ejemplo, en formato APA o IEEE), 
        correos electrónicos, figuras, tablas, ecuaciones y otros elementos no deseados.
        """
        texto = self.texto_limpio
        # Eliminar correos electrónicos
        texto = re.sub(r'\S+@\S+', '', texto)
        # Eliminar referencias tipo IEEE [1], [2,3], [4-6] y tipo APA (Autor, 2020)
        texto = re.sub(r'\[\d+(?:,\s*\d+)*(-\d+)?\]|\([^\(\)]*?\d{4}[^\(\)]*?\)', '', texto)
        # Eliminar menciones a figuras, tablas, ecuaciones, imágenes, ilustraciones, etc.
        texto = re.sub(r'(figura|tabla|ecuación|imagen|ilustración)\s*\d*', '', texto, flags=re.IGNORECASE)
        self.texto_limpio = texto

    def crear_parrafos(self) -> None:
        """
        Crea parrafos a partir de las lineas ya limpias. 
        Elimina saltos de linea hasta un punto y seguido, además de guiones entre palabras que son separadas por un parrafo.
        """
        # Eliminar '- \n' entre linea y linea 
        self.texto_limpio = re.sub(r'-\s*\n', '', self.texto_limpio)

        # Unir líneas dentro de párrafos: se reemplaza el salto de línea que es seguido por una letra minúscula u otro simbolo de puntuación, excepto el punto.
        self.texto_limpio = re.sub(r'\n(?=\s*[a-z,“‘«,:;()\[\]¿¡\-])', ' ', self.texto_limpio)
        
        # Mantener la separación de párrafos: se reemplazan múltiples saltos de línea por dos
        self.texto_limpio = re.sub(r'\n{2,}', '\n\n', self.texto_limpio)

        # Eliminar espacios dobles o más
        self.texto_limpio = re.sub(r' {2,}', ' ', self.texto_limpio)

        # Eliminar espacio antes de punto y coma
        self.texto_limpio = re.sub(r' (?=[.,])', '', self.texto_limpio)
