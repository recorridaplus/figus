document.addEventListener('DOMContentLoaded', () => {
    // ==========================================================================
    // DOM ELEMENTS
    // ==========================================================================
    const charNameInput = document.getElementById('char-name');
    const nameDisplay = document.getElementById('name-display');
    const allianceOptions = document.querySelectorAll('input[name="alliance"]');
    const tradingCard = document.getElementById('trading-card');
    const allianceDisplay = document.getElementById('alliance-display');
    const badgeLeft = document.getElementById('badge-left');
    
    // Country flag list containers
    const ententeCountries = document.querySelector('.entente-countries');
    const alianzaCountries = document.querySelector('.alianza-countries');
    
    // Upload elements
    const fileInput = document.getElementById('file-input');
    const uploadZone = document.getElementById('upload-zone');
    const photoPlaceholder = document.getElementById('photo-placeholder');
    const photoViewport = document.getElementById('photo-viewport');
    const cardPhotoImg = document.getElementById('card-photo-img');
    const photoControls = document.getElementById('photo-controls');
    const photoContainer = document.querySelector('.card-photo-container');
    
    // Photo manipulation controls
    const zoomSlider = document.getElementById('zoom-slider');
    const btnRotateLeft = document.getElementById('btn-rotate-left');
    const btnRotateRight = document.getElementById('btn-rotate-right');
    
    // Action buttons
    const btnDownload = document.getElementById('btn-download');
    const btnReset = document.getElementById('btn-reset');

    // ==========================================================================
    // STATE VARIABLES
    // ==========================================================================
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let currentX = 0; // Current left offset of image
    let currentY = 0; // Current top offset of image
    let scale = 1;
    let rotateAngle = 0;

    // ==========================================================================
    // INITIALIZATION & REAL-TIME SYNC
    // ==========================================================================
    
    // Real-time character name input sync
    charNameInput.addEventListener('input', (e) => {
        const value = e.target.value.trim();
        nameDisplay.textContent = value || 'Nombre del Personaje';
    });

    // Alliance Selection Toggle
    allianceOptions.forEach(radio => {
        radio.addEventListener('change', (e) => {
            const selectedAlliance = e.target.value;
            
            // Update UI selected radio wrapper styling
            document.querySelectorAll('.alliance-option').forEach(opt => {
                opt.classList.remove('active');
            });
            e.target.closest('.alliance-option').classList.add('active');
            
            // Toggle theme and elements on the card
            if (selectedAlliance === 'entente') {
                tradingCard.classList.remove('alianza-theme');
                tradingCard.classList.add('entente-theme');
                allianceDisplay.textContent = 'triple entente';
                
                // Show Entente elements, hide Alianza
                ententeCountries.style.display = 'flex';
                alianzaCountries.style.display = 'none';
                badgeLeft.style.display = 'flex';
            } else {
                tradingCard.classList.remove('entente-theme');
                tradingCard.classList.add('alianza-theme');
                allianceDisplay.textContent = 'triple alianza';
                
                // Show Alianza elements, hide Entente
                ententeCountries.style.display = 'none';
                alianzaCountries.style.display = 'flex';
                badgeLeft.style.display = 'flex';
            }
        });
    });

    // ==========================================================================
    // IMAGE UPLOAD & VISUALIZER SETUP
    // ==========================================================================
    

    // Handle drag events on upload zone for visual feedback
    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.style.backgroundColor = '#fffdec';
        uploadZone.style.borderColor = 'var(--crayon-yellow)';
    });

    uploadZone.addEventListener('dragleave', () => {
        uploadZone.style.backgroundColor = 'var(--color-paper)';
        uploadZone.style.borderColor = 'var(--color-text)';
    });

    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.style.backgroundColor = 'var(--color-paper)';
        uploadZone.style.borderColor = 'var(--color-text)';
        
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleImageFile(e.dataTransfer.files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
            handleImageFile(e.target.files[0]);
        }
    });

    // Reader for local image file
    function handleImageFile(file) {
        if (!file.type.startsWith('image/')) {
            alert('Por favor sube un archivo de imagen válido (PNG, JPG, WebP).');
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            
            // Setup error handler
            cardPhotoImg.onerror = function() {
                console.error('El navegador no pudo cargar la imagen en el elemento <img>.');
            };

            // Setup onload handler BEFORE setting the source to avoid race condition where local data URLs load instantly
            cardPhotoImg.onload = function() {
                photoPlaceholder.style.display = 'none';
                photoViewport.style.display = 'block';
                photoControls.classList.remove('disabled');
                
                // Reset state parameters
                scale = 1;
                rotateAngle = 0;
                zoomSlider.value = 1;
                
                // Calculate size to initially fit viewport center
                const containerWidth = photoContainer.clientWidth;
                const containerHeight = photoContainer.clientHeight;
                const imgWidth = cardPhotoImg.naturalWidth;
                const imgHeight = cardPhotoImg.naturalHeight;
                
                // Scale to cover container
                const ratioW = containerWidth / imgWidth;
                const ratioH = containerHeight / imgHeight;
                const baseScale = Math.max(ratioW, ratioH);
                
                scale = baseScale;
                zoomSlider.min = baseScale * 0.5;
                zoomSlider.max = baseScale * 4.0;
                zoomSlider.value = baseScale;
                
                currentX = (containerWidth - (imgWidth * scale)) / 2;
                currentY = (containerHeight - (imgHeight * scale)) / 2;
                
                updateImageTransform();
            };
            
            cardPhotoImg.src = e.target.result;
        };
        
        reader.onerror = function() {
            console.error('Falló la lectura del archivo con FileReader.');
        };
        
        reader.readAsDataURL(file);
    }

    // Update image transform values in real time
    function updateImageTransform() {
        cardPhotoImg.style.left = `${currentX}px`;
        cardPhotoImg.style.top = `${currentY}px`;
        cardPhotoImg.style.transform = `scale(${scale}) rotate(${rotateAngle}deg)`;
    }

    // ==========================================================================
    // DRAG & DROP POSITIONING (PANNING) ON CARD
    // ==========================================================================
    
    // Mouse Down / Touch Start
    const startDrag = (clientX, clientY) => {
        if (!cardPhotoImg.src || photoViewport.style.display === 'none') return;
        isDragging = true;
        photoContainer.classList.add('drag-active');
        
        startX = clientX - currentX;
        startY = clientY - currentY;
    };

    // Mouse Move / Touch Move
    const drag = (clientX, clientY) => {
        if (!isDragging) return;
        
        currentX = clientX - startX;
        currentY = clientY - startY;
        
        // Boundaries checks could go here, but free dragging is usually better for custom cropping
        updateImageTransform();
    };

    // Mouse Up / Touch End
    const endDrag = () => {
        isDragging = false;
        photoContainer.classList.remove('drag-active');
    };

    // Desktop Mouse Events
    photoContainer.addEventListener('mousedown', (e) => {
        e.preventDefault(); // Prevents image ghosting/browser drag
        startDrag(e.clientX, e.clientY);
    });

    window.addEventListener('mousemove', (e) => {
        drag(e.clientX, e.clientY);
    });

    window.addEventListener('mouseup', () => {
        endDrag();
    });

    // Mobile Touch Events
    photoContainer.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
            startDrag(e.touches[0].clientX, e.touches[0].clientY);
        }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
        if (e.touches.length === 1) {
            drag(e.touches[0].clientX, e.touches[0].clientY);
        }
    }, { passive: true });

    window.addEventListener('touchend', () => {
        endDrag();
    });

    // ==========================================================================
    // PHOTO ADJUSTMENT CONTROLS
    // ==========================================================================
    
    // Zoom Slider
    zoomSlider.addEventListener('input', (e) => {
        scale = parseFloat(e.target.value);
        updateImageTransform();
    });

    // Rotation controls
    btnRotateLeft.addEventListener('click', () => {
        rotateAngle = (rotateAngle - 90) % 360;
        updateImageTransform();
    });

    btnRotateRight.addEventListener('click', () => {
        rotateAngle = (rotateAngle + 90) % 360;
        updateImageTransform();
    });

    // ==========================================================================
    // DOWNLOADING / GENERATING CARD IMAGE
    // ==========================================================================
    
    btnDownload.addEventListener('click', () => {
        if (!cardPhotoImg.src || photoViewport.style.display === 'none') {
            alert('Por favor sube una foto antes de descargar tu figurita.');
            return;
        }

        // Show loading state
        const originalText = btnDownload.innerHTML;
        btnDownload.disabled = true;
        btnDownload.innerHTML = `
            <svg class="btn-icon spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="10" stroke-width="3" stroke-dasharray="32" stroke-linecap="round"></circle>
            </svg>
            Generando Figurita...
        `;

        // Render card with html2canvas. 
        // We use scale: 3 for high resolution (about 930x1350px), suitable for printing
        html2canvas(tradingCard, {
            scale: 3, 
            useCORS: true,
            logging: false,
            backgroundColor: null
        }).then(canvas => {
            // Convert to PNG data URL
            const imgData = canvas.toDataURL('image/png');
            
            // Format file name based on user name
            const charName = charNameInput.value.trim().replace(/[^a-zA-Z0-9]/g, '_') || 'soldado';
            const fileName = `HistoCards_${charName}_1914.png`;
            
            // Create anchor and download
            const link = document.createElement('a');
            link.download = fileName;
            link.href = imgData;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Restore button
            btnDownload.disabled = false;
            btnDownload.innerHTML = originalText;
        }).catch(err => {
            console.error('Error al generar la figurita:', err);
            alert('Hubo un error al generar la imagen. Intenta nuevamente.');
            btnDownload.disabled = false;
            btnDownload.innerHTML = originalText;
        });
    });

    // ==========================================================================
    // RESET EVENT
    // ==========================================================================
    
    btnReset.addEventListener('click', () => {
        if (confirm('¿Estás seguro de que quieres restablecer todo el formulario?')) {
            // Reset inputs
            charNameInput.value = '';
            nameDisplay.textContent = 'Nombre del Personaje';
            
            // Reset alliance to Entente
            document.getElementById('file-input').value = '';
            allianceOptions[0].checked = true;
            allianceOptions[0].dispatchEvent(new Event('change'));
            
            // Hide image and show placeholder
            cardPhotoImg.src = '';
            photoViewport.style.display = 'none';
            photoPlaceholder.style.display = 'flex';
            photoControls.classList.add('disabled');
            
            // Reset manipulation state
            scale = 1;
            rotateAngle = 0;
            currentX = 0;
            currentY = 0;
            updateImageTransform();
        }
    });
});
