// Variables de estado global
let paramsApplied = false;
let fileUploaded = false;
let currentFile = null;

// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function() {
    // Inicialización de todos los componentes
    initLanguageSystem();
    
    initFileUpload();
    initParamControls();
    initInfoButtons();
    setupDragAndDrop();
});

// Función para inicializar la subida de archivos
function initFileUpload() {
    const fileInput = document.getElementById('file');
    const fileNameSpan = document.getElementById('file-name');
    const dropZone = document.getElementById('drop-zone');
    const fileDisplay = document.getElementById('file-display');
    const changeFileBtn = document.getElementById('change-file-btn');

    // Evento para selección manual de archivo
    fileInput.addEventListener('change', function(e) {
        if (this.files && this.files.length > 0) {
            const file = this.files[0];
            if (validateFile(file)) {
                currentFile = file;
                updateFileUI(file);
            }
        }
    });

    // Permitir que el drop-zone active el input file
    dropZone.addEventListener('click', function() {
        fileInput.click();
    });

    // Botón para cambiar archivo
    changeFileBtn.addEventListener('click', function() {
        resetFileInput();
    });

    // Función para validar el archivo
    function validateFile(file) {
        if (file.type !== 'application/pdf') {
            showToast(t('toast_pdf_only'), 'info');
            return false;
        }
        
        if (file.size > 5 * 1024 * 1024) { // 5MB límite
            showToast(t('toast_file_too_large'), 'warning');
            return false;
        }
        
        return true;
    }

    // Función para actualizar la UI con el archivo seleccionado
    function updateFileUI(file) {
        fileUploaded = true;
        
        // Ocultar drop-zone y mostrar info del archivo
        dropZone.style.display = 'none';
        fileDisplay.style.display = 'flex';
        document.querySelector('.file-name-text').textContent = `${file.name} (${formatFileSize(file.size)})`;
        
        // Habilitar botones relevantes
        document.getElementById('summarizeBtn').disabled = false;
        checkGenerateButtonState();
    }

    // Función para resetear la selección de archivo
    function resetFileInput() {
        fileInput.value = '';
        fileUploaded = false;
        currentFile = null;
        
        // Mostrar drop-zone y ocultar info del archivo
        dropZone.style.display = 'block';
        document.getElementById('file-display').style.display = 'none';
        
        // Deshabilitar botones relevantes
        document.getElementById('summarizeBtn').disabled = true;
        document.getElementById('generate-summary-btn').disabled = true;
    }
}

// Función para configurar el drag and drop
function setupDragAndDrop() {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file');

    // Prevenir comportamientos por defecto
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });

    // Resaltar el drop zone cuando se arrastra sobre él
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });

    // Manejar la caída del archivo
    dropZone.addEventListener('drop', handleDrop, false);

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    function highlight() {
        dropZone.classList.add('highlight');
    }

    function unhighlight() {
        dropZone.classList.remove('highlight');
    }

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length > 0) {
            fileInput.files = files;
            const file = files[0];
            if (validateFile(file)) {
                currentFile = file;
                updateFileUI(file);
            }
        }
    }
}

// Función para inicializar los controles de parámetros
function initParamControls() {
    // Configurar los sliders y sus valores mostrados
    const params = {
        temperature: 0.3,
        top_p: 0.6,
        repeat_penalty: 1.1,
        repeat_last_n: 64,
        num_predict: 500
    };

    const paramsDefault = {
        temperature: 0.3,
        top_p: 0.6,
        repeat_penalty: 1.1,
        repeat_last_n: 64,
        num_predict: 500
    };

    // Configurar eventos para cada parámetro
    setupParamSlider('temperature', 'temp-value', params);
    setupParamSlider('top_p', 'top_p-value', params);
    setupParamSlider('repeat_penalty', 'repeat_penalty-value', params);
    setupParamSlider('repeat_last_n', 'repeat_last_n-value', params);
    
    document.getElementById('num_predict').addEventListener('input', function() {
        params.num_predict = parseInt(this.value);
    });

    // Botón para restablecer valores
    document.getElementById('reset-params-btn').addEventListener('click', function() {
        resetParams(params);
    });

    // Botón para aplicar parámetros
    document.getElementById('apply-params-btn').addEventListener('click', function() {
        paramsApplied = true;
        showToast(t('toast_params_applied'), 'success');
        checkGenerateButtonState();
    });

    // Botón para generar resumen con valores predeterminados
    document.getElementById('summarizeBtn').addEventListener('click', function() {
        if (!validateBeforeGenerateFile()) return;
        generateSummary(currentFile, paramsDefault);
    });

    // Botón para generar resumen con valores luego de aplicar cambios
    document.getElementById('generate-summary-btn').addEventListener('click', function() {
        if (!validateBeforeGenerateFile() && !validateBeforeGenerateParams()) return;
        // Obtener valores del HTML
        generateSummary(currentFile, params);
    });

    // Función auxiliar para configurar sliders
    function setupParamSlider(sliderId, valueId, paramsObj) {
        const slider = document.getElementById(sliderId);
        const valueDisplay = document.getElementById(valueId);
        
        slider.addEventListener('input', function() {
            const value = parseFloat(this.value);
            paramsObj[sliderId] = value;
            valueDisplay.textContent = value;
        });
    }

    // Función para resetear parámetros
    function resetParams(paramsObj) {
        paramsApplied = false;
        
        // Restablecer valores por defecto
        const defaults = {
            temperature: 0.3,
            top_p: 0.6,
            repeat_penalty: 1.1,
            repeat_last_n: 64,
            num_predict: 500
        };

        // Actualizar UI y objeto de parámetros
        Object.keys(defaults).forEach(key => {
            paramsObj[key] = defaults[key];
            const slider = document.getElementById(key);
            if (slider) slider.value = defaults[key];
            
            const valueDisplay = document.getElementById(`${key}-value`);
            if (valueDisplay) valueDisplay.textContent = defaults[key];
            document.getElementById('temp-value').textContent = '0.3';
        });

        document.getElementById('num_predict').value = defaults.num_predict;
        checkGenerateButtonState();
        showToast(t('toast_params_reset'), 'success');
    }
}

// Función para inicializar los botones de información
function initInfoButtons() {
    // Configuración para los botones de información de parámetros
    document.querySelectorAll('.info-button[data-param]').forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            const param = this.getAttribute('data-param');
            toggleInfoPanel(param, this);
        });
    });

    // Configuración especial para el botón de información del resumen (si existe)
    const summaryInfoButton = document.getElementById('custom-summary-info');
    if (summaryInfoButton) {
        summaryInfoButton.addEventListener('click', function(e) {
            e.stopPropagation();
            toggleInfoPanel('custom-summary', this);
        });
    }

    // Cierre al hacer clic fuera de cualquier panel de información
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.info-button') && !e.target.closest('.param-info')) {
            closeAllInfoPanels();
        }
    });

    // Función para alternar paneles de información
    function toggleInfoPanel(param, button) {
        const isCustomSummary = param === 'custom-summary';
        const panelId = isCustomSummary ? 'custom-summary-info-content' : `info-${param}`;
        const panel = document.getElementById(panelId);

        if (!panel) return;

        const isShowing = panel.style.display === 'block';

        // Cerrar todos los paneles primero
        closeAllInfoPanels();

        // Abrir el panel seleccionado si no estaba mostrándose
        if (!isShowing) {
            panel.style.display = 'block';
            const icon = button.querySelector('i');
            if (icon) icon.classList.add('fa-rotate-90');
        }
    }

    // Función para cerrar todos los paneles de información
    function closeAllInfoPanels() {
        document.querySelectorAll('.param-info, #custom-summary-info-content').forEach(div => {
            div.style.display = 'none';
        });

        document.querySelectorAll('.info-button i').forEach(icon => {
            icon.classList.remove('fa-rotate-90');
        });
    }
}

// Función para validar antes de generar el resumen
function validateBeforeGenerateFile() {
    if (!fileUploaded) {
        showToast(t('toast_upload_pdf'), 'warning');
        return false;
    }
    return true;
}
// Función para validar antes de generar el resumen
function validateBeforeGenerateParams() {
    if (!paramsApplied) {
        showToast(t('toast_apply_params'), 'warning');
        return false;
    }
    
    return true;
}

// Función para verificar el estado del botón Generar
function checkGenerateButtonState() {
    const generateBtn = document.getElementById('generate-summary-btn');
    if (generateBtn) {
        generateBtn.disabled = !(fileUploaded && paramsApplied);
    }
}

// Función para generar el resumen con el endpoint /sumarize
async function generateSummary(file, params) {
    const summaryContainer = document.getElementById('summary-container');
    const summaryText = document.getElementById('summary-text');

    const summarizeBtn = document.getElementById('summarizeBtn');
    const generateBtn = document.getElementById('generate-summary-btn');

    // 🔒 Desactivar botones
    summarizeBtn.disabled = true;
    generateBtn.disabled = true;
    summarizeBtn.innerHTML =
    `<i class="fas fa-spinner fa-spin"></i> ${t('generating')}`;

    summaryContainer.style.display = 'none';
    summaryText.value = '';

    const formData = new FormData();
    formData.append('archivo_pdf', file);
    formData.append('temperature', params.temperature);
    formData.append('top_p', params.top_p);
    formData.append('repeat_penalty', params.repeat_penalty);
    formData.append('repeat_last_n', params.repeat_last_n);
    formData.append('num_predict', params.num_predict);

    try {
        showToast(t('toast_generating_summary'), 'info');
        
        const response = await fetch('/sumarizer', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();

        if (!response.ok) {
            const mensajeError = data.detail || data.error || 'No se pudo generar el resumen.';
            showToast(`Error: ${mensajeError}`, 'error');
            return;
        }

        summaryText.value = data.resumen || 'Resumen no disponible.';
        summaryContainer.style.display = 'block';

        showToast(t('toast_summary_success'), 'success');

    } catch (error) {
        showToast(t('toast_summary_error'), 'error');
    } finally {
        // 🔓 Reactivar botones SIEMPRE (éxito o error)
        summarizeBtn.disabled = false;
        summarizeBtn.innerHTML =
        `<i class="fas fa-magic"></i> ${t('summarize')}`;

        checkGenerateButtonState(); // vuelve a habilitar si aplica
    }
}


// Función para mostrar notificaciones toast
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');

    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('show');
    }, 100);

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 400);
    }, 3000);
}

// Función para formatear el tamaño del archivo
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// Función para copiar el resumen al portapapeles
window.copySummary = function() {
    const summaryText = document.getElementById('summary-text');
    const copyBtn = document.querySelector('.copy-button');
    
    summaryText.select();
    document.execCommand('copy');
    
    // Mostrar feedback visual
    const originalText = copyBtn.innerHTML;
    copyBtn.innerHTML =
    `<i class="fas fa-check"></i> ${t('copied')}`;
    
    setTimeout(() => {
        copyBtn.innerHTML = originalText;
    }, 2000);
};

// ============================
// Traducciones
// ============================

const translations = {

    // =====================================
    // ESPAÑOL
    // =====================================

    es: {

        // NAV
        summarizer: "Sumarizador",
        api_docs: "Documentación API",

        // HOME
        main_title: "Sumarizador de Artículos Científicos",

        subtitle: "Sube un PDF para obtener un resumen automático",

        select_pdf: "Seleccionar PDF",

        summarize: "Sumarizar",

        generating: "Generando...",

        generated_summary: "Resumen generado",

        copy_summary: "Copiar resumen",

        copied: "¡Copiado!",

        customize_summary: "Personalizar Resumen",

        reset_values: "Restablecer valores",

        apply_params: "Aplicar parámetros",

        generate_summary: "Generar resumen",

        max_size: "Tamaño máximo: 5MB",

        change_file: "Cambiar",

        footer_warning:
            "Este resumen es generado automáticamente y no reemplaza la visión crítica de un humano.",

        // CUSTOM SUMMARY INFO

        custom_summary_info_intro:
            "La personalización del resumen te permite ajustar cómo el sistema procesa y genera el contenido a través de sus parámetros:",

        creativity: "Creatividad",

        creativity_desc:
            ": Controla qué tan literal o interpretativo será el resumen.",

        focus: "Enfoque",

        focus_desc:
            ": Determina si el resumen será más general o específico.",

        repeat_penalty_title:
            "Penalización por repetición",

        repeat_penalty_desc:
            ": Reduce la redundancia en el contenido.",

        repeat_memory_title:
            "Memoria anti-repetición",

        repeat_memory_desc:
            ": Determina cuántas palabras anteriores penaliza la repetición.",

        max_length:
            "Longitud máxima",

        max_length_desc:
            ": Limita la extensión del resumen final.",

        custom_summary_info_footer:
            "Experimenta con diferentes configuraciones para obtener mejores resultados.",

        // TEMPERATURE

        temperature_label:
            "Creatividad (Temperature)",

        temperature_help:
            "Controla la aleatoriedad (bajo = más preciso, alto = más creativo).",

        temperature_info:
            "Este parámetro controla cuán creativo o conservador será el resumen.",

        // TOP P

        top_p_label:
            "Enfoque (Top-P)",

        top_p_help:
            "Controla la diversidad de opciones consideradas.",

        top_p_info:
            "Top-P selecciona las palabras más probables según su probabilidad acumulada.",

        // REPEAT PENALTY

        repeat_penalty_label:
            "Penalización por repetición",

        repeat_penalty_help:
            "Controla cuánto se penalizan las repeticiones.",

        repeat_penalty_info:
            "Reduce la probabilidad de repetir palabras o frases.",

        // REPEAT LAST N

        repeat_last_n_label:
            "Memoria anti-repetición",

        repeat_last_n_help:
            "Define cuántos tokens recientes se revisan.",

        repeat_last_n_info:
            "Ayuda a evitar repeticiones recientes en textos largos.",

        // MAX TOKENS

        max_tokens_label:
            "Longitud máxima (Tokens)",

        max_tokens_help:
            "Limita la extensión máxima del resumen.",

        max_tokens_info:
            "Limita la longitud total del resumen generado.",

        // API DOCS

        api_documentation_title:
            "Documentación de la API",

        api_documentation_subtitle:
            "Interfaz para integrar el servicio de resumen de artículos científicos",

        main_endpoint:
            "Endpoint Principal",

        endpoint_description:
            "Procesa un artículo científico en PDF y devuelve un resumen estructurado.",

        request_parameters:
            "Parámetros de la solicitud",

        parameter:
            "Parámetro",

        type:
            "Tipo",

        required:
            "Obligatorio",

        description:
            "Descripción",

        yes:
            "Sí",

        no:
            "No",

        file_description:
            "Archivo PDF del artículo científico",

        temperature_api_description:
            "Controla la creatividad (0.0 a 1.0, default: 0.3)",

        top_p_api_description:
            "Controla el enfoque (0.1 a 1.0, default: 0.6)",

        max_tokens_api_description:
            "Longitud máxima del resumen (100 a 2000, default: 500)",

        request_example:
            "Ejemplo de solicitud",

        response:
            "Respuesta",

        response_description:
            "La API devuelve un objeto JSON con la siguiente estructura:",

        error_codes:
            "Códigos de error",

        code:
            "Código",

        error_400:
            "Solicitud mal formada (archivo faltante o inválido)",

        error_413:
            "Archivo demasiado grande (límite: 5MB)",

        error_415:
            "Tipo de archivo no soportado (solo PDF)",

        error_500:
            "Error interno del servidor",

        try_api:
            "Prueba la API",

        try_api_description:
            "Puedes probar el endpoint directamente desde nuestro cliente interactivo:",

        swagger_button:
            "Probar en Swagger UI",

        full_docs_description:
            "O consulta la documentación interactiva completa:",

        redoc_button:
            "Ver documentación completa",

        footer_api:
            "Este servicio es proporcionado por alumnos de UPIIZ-IPN.",

        // TOASTS

        toast_pdf_only:
            "Por favor, sube solo archivos PDF",

        toast_file_too_large:
            "El archivo es demasiado grande (máximo 5MB)",

        toast_params_applied:
            "Parámetros aplicados correctamente",

        toast_params_reset:
            "Parámetros restablecidos a valores predeterminados",

        toast_upload_pdf:
            "Por favor, sube un archivo PDF primero",

        toast_apply_params:
            "Por favor, aplica los parámetros primero",

        toast_generating_summary:
            "Generando resumen...",

        toast_summary_success:
            "Resumen generado con éxito",

        toast_summary_error:
            "Ocurrió un error al generar el resumen"

    },

    // =====================================
    // ENGLISH
    // =====================================

    en: {

        // NAV
        summarizer: "Summarizer",
        api_docs: "API Documentation",

        // HOME
        main_title: "Scientific Article Summarizer",

        subtitle: "Upload a PDF to get an automatic summary",

        select_pdf: "Select PDF",

        summarize: "Summarize",

        generating: "Generating...",

        generated_summary: "Generated Summary",

        copy_summary: "Copy Summary",

        copied: "Copied!",

        customize_summary: "Customize Summary",

        reset_values: "Reset Values",

        apply_params: "Apply Parameters",

        generate_summary: "Generate Summary",

        max_size: "Maximum size: 5MB",

        change_file: "Change",

        footer_warning:
            "This summary is automatically generated and does not replace human critical analysis.",

        // CUSTOM SUMMARY INFO

        custom_summary_info_intro:
            "Summary customization allows you to adjust how the system processes and generates content through its parameters:",

        creativity: "Creativity",

        creativity_desc:
            ": Controls how literal or interpretative the summary will be.",

        focus: "Focus",

        focus_desc:
            ": Determines whether the summary will be more general or specific.",

        repeat_penalty_title:
            "Repeat penalty",

        repeat_penalty_desc:
            ": Reduces redundancy in the content.",

        repeat_memory_title:
            "Anti-repetition memory",

        repeat_memory_desc:
            ": Determines how many previous words are penalized for repetition.",

        max_length:
            "Maximum length",

        max_length_desc:
            ": Limits the final summary length.",

        custom_summary_info_footer:
            "Experiment with different settings to achieve better results.",

        // TEMPERATURE

        temperature_label:
            "Creativity (Temperature)",

        temperature_help:
            "Controls randomness (low = more precise, high = more creative).",

        temperature_info:
            "This parameter controls how creative or conservative the summary will be.",

        // TOP P

        top_p_label:
            "Focus (Top-P)",

        top_p_help:
            "Controls the diversity of considered options.",

        top_p_info:
            "Top-P selects the most probable words according to cumulative probability.",

        // REPEAT PENALTY

        repeat_penalty_label:
            "Repeat Penalty",

        repeat_penalty_help:
            "Controls how much repetitions are penalized.",

        repeat_penalty_info:
            "Reduces the probability of repeating words or phrases.",

        // REPEAT LAST N

        repeat_last_n_label:
            "Anti-repetition Memory",

        repeat_last_n_help:
            "Defines how many recent tokens are checked.",

        repeat_last_n_info:
            "Helps avoid recent repetitions in long texts.",

        // MAX TOKENS

        max_tokens_label:
            "Maximum Length (Tokens)",

        max_tokens_help:
            "Limits the maximum summary length.",

        max_tokens_info:
            "Limits the total generated summary length.",

        // API DOCS

        api_documentation_title:
            "API Documentation",

        api_documentation_subtitle:
            "Interface for integrating the scientific article summarization service",

        main_endpoint:
            "Main Endpoint",

        endpoint_description:
            "Processes a scientific PDF article and returns a structured summary.",

        request_parameters:
            "Request Parameters",

        parameter:
            "Parameter",

        type:
            "Type",

        required:
            "Required",

        description:
            "Description",

        yes:
            "Yes",

        no:
            "No",

        file_description:
            "Scientific article PDF file",

        temperature_api_description:
            "Controls creativity (0.0 to 1.0, default: 0.3)",

        top_p_api_description:
            "Controls focus (0.1 to 1.0, default: 0.6)",

        max_tokens_api_description:
            "Maximum summary length (100 to 2000, default: 500)",

        request_example:
            "Request Example",

        response:
            "Response",

        response_description:
            "The API returns a JSON object with the following structure:",

        error_codes:
            "Error Codes",

        code:
            "Code",

        error_400:
            "Malformed request (missing or invalid file)",

        error_413:
            "File too large (limit: 5MB)",

        error_415:
            "Unsupported file type (PDF only)",

        error_500:
            "Internal server error",

        try_api:
            "Try the API",

        try_api_description:
            "You can test the endpoint directly from our interactive client:",

        swagger_button:
            "Try in Swagger UI",

        full_docs_description:
            "Or check the full interactive documentation:",

        redoc_button:
            "View Full Documentation",

        footer_api:
            "This service is provided by UPIIZ-IPN students.",

        // TOASTS

        toast_pdf_only:
            "Please upload PDF files only",

        toast_file_too_large:
            "The file is too large (maximum 5MB)",

        toast_params_applied:
            "Parameters applied successfully",

        toast_params_reset:
            "Parameters reset to default values",

        toast_upload_pdf:
            "Please upload a PDF file first",

        toast_apply_params:
            "Please apply the parameters first",

        toast_generating_summary:
            "Generating summary...",

        toast_summary_success:
            "Summary generated successfully",

        toast_summary_error:
            "An error occurred while generating the summary"

    }

};

let currentLanguage = localStorage.getItem("language") || "es";

function t(key) {
    return translations[currentLanguage][key] || key;
}

// ============================
// TRADUCIR PÁGINA
// ============================

function translatePage(language) {

    currentLanguage = language;

    document.querySelectorAll("[data-i18n]").forEach(element => {

        const key = element.getAttribute("data-i18n");

        if (translations[language][key]) {

            element.textContent =
                translations[language][key];

        }

    });

    // Actualizar texto del botón idioma
    const languageText =
        document.getElementById("language-text");

    if (languageText) {

        languageText.textContent =
            language === "es" ? "EN" : "ES";

    }

    document.documentElement.lang = language;

    localStorage.setItem("language", language);

}

function initLanguageSystem() {

    translatePage(currentLanguage);

    const toggleBtn =
        document.getElementById("language-toggle");

    if (toggleBtn) {

        toggleBtn.addEventListener("click", () => {

            const newLang =
                currentLanguage === "es"
                    ? "en"
                    : "es";

            translatePage(newLang);

        });

    }

}