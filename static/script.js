// Variables de estado global
let paramsApplied = false;
let fileUploaded = false;
let currentFile = null;

// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function() {
    // Inicialización de todos los componentes
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
            showToast('Por favor, sube solo archivos PDF', 'info');
            return false;
        }
        
        if (file.size > 5 * 1024 * 1024) { // 5MB límite
            showToast('El archivo es demasiado grande (máximo 5MB)', 'warning');
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
        showToast('Parámetros aplicados correctamente','success');
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
        showToast('Parámetros restablecidos a valores predeterminados','success');
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
        showToast('Por favor, sube un archivo PDF primero', 'warning');
        return false;
    }
    return true;
}
// Función para validar antes de generar el resumen
function validateBeforeGenerateParams() {
    if (!paramsApplied) {
        showToast('Por favor, aplica los parámetros primero', 'warning');
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
    summarizeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generando...';

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
        showToast('Generando resumen...', 'info');
        
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

        showToast('Resumen generado con éxito', 'success');

    } catch (error) {
        showToast('Ocurrió un error al generar el resumen', 'error');
    } finally {
        // 🔓 Reactivar botones SIEMPRE (éxito o error)
        summarizeBtn.disabled = false;
        summarizeBtn.innerHTML = '<i class="fas fa-magic"></i> Sumarizar';

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
    copyBtn.innerHTML = '<i class="fas fa-check"></i> Copiado!';
    
    setTimeout(() => {
        copyBtn.innerHTML = originalText;
    }, 2000);
};