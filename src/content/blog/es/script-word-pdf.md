---
title: Script para convertir documentos de Word a PDF
description: En este tutorial aprenderás a crear un script en Python que convierte documentos de Word a PDF utilizando la biblioteca win32com.
pubDate: 2024-10-24
updatedDate: 2024-10-24
cover: ../../../assets/blog/script-word-pdf.webp
coverAlt: "Convertir Word a PDF"
tags: ["script", "python", "windows", "pdf", "venv", "env", "pywin32"]
---
En este tutorial aprenderás a crear un script en Python que convierte documentos de Word a PDF utilizando la biblioteca `win32com.client`. Además, te mostraremos cómo gestionar el proyecto con un entorno virtual.

> **Nota:** Este script está diseñado para funcionar en sistemas Windows, ya que utiliza componentes específicos de Windows.

## 1. Crear y activar un entorno virtual

Crea un entorno virtual para aislar las dependencias del proyecto:

```bash
python -m venv env
```

### Activa el entorno virtual:
- Windows:
```bash
env\Scripts\activate
```

## 2. Instalar dependencias
Instala la biblioteca `pywin32`, que proporciona el acceso a `win32com.client`:
```bash
pip install pywin32
```

## 3. Crear el script de conversión
Crea un archivo llamado `convert.py` y copia el siguiente código:
```python
import os
import win32com.client
import sys

def convert_word_to_pdf(input_folder, output_folder=None):
    """Convierte todos los documentos de Word en una carpeta a PDF."""
    # Configurar la aplicación de Word
    word = win32com.client.Dispatch("Word.Application")
    word.Visible = False  # Ocultar la interfaz de Word

    try:
        # Crear carpeta de salida si no existe
        if output_folder and not os.path.exists(output_folder):
            os.makedirs(output_folder)

        # Recorrer todos los archivos en la carpeta
        for filename in os.listdir(input_folder):
            if filename.lower().endswith(('.doc', '.docx')):
                # Construir rutas completas
                doc_path = os.path.join(input_folder, filename)
                pdf_name = os.path.splitext(filename)[0] + ".pdf"
                pdf_path = os.path.join(output_folder, pdf_name) if output_folder else os.path.join(input_folder, pdf_name)

                try:
                    # Convertir documento
                    doc = word.Documents.Open(doc_path)
                    doc.SaveAs(pdf_path, FileFormat=17)  # 17 = Formato PDF
                    doc.Close()
                    print(f"Convertido: {filename} -> {pdf_name}")
                except Exception as e:
                    print(f"Error al convertir {filename}: {str(e)}")
    finally:
        # Cerrar Word en cualquier caso
        word.Quit()

if __name__ == "__main__":
    # Configurar rutas
    input_folder = input("Introduce la ruta de la carpeta (deja vacío para usar el directorio actual): ").strip() or os.getcwd()

    if not os.path.exists(input_folder):
        print("¡La carpeta especificada no existe!")
        sys.exit(1)

    output_option = input("¿Deseas guardar los PDFs en una subcarpeta? (s/n): ").strip().lower()

    if output_option == 's':
        output_folder = os.path.join(input_folder, "PDFs")
    else:
        output_folder = None

    # Ejecutar conversión
    convert_word_to_pdf(input_folder, output_folder)
    print("¡Conversión completada!")
```

## 4. Ejecutar el script
Con el entorno virtual activado, ejecuta el script desde la terminal:
```bash
python convert.py
```
Sigue las instrucciones en pantalla para indicar la carpeta de entrada y si deseas guardar los archivos PDF en una subcarpeta.

## Conclusión
En este tutorial has aprendido a:

- Configurar un entorno virtual en Python.
- Instalar la dependencia `pywin32`.
- Crear y ejecutar un script para convertir documentos de Word a PDF utilizando `win32com.client`.
¡Ahora estás listo para ampliar y personalizar tu script según tus necesidades!