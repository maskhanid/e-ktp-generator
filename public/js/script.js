// Form validation for E-KTP Generator
document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('form');
    
    // Signature Pad
    const canvas = document.getElementById('signatureCanvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let isDrawing = false;
        let lastX = 0;
        let lastY = 0;
        
        // Style untuk tanda tangan
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // Event listener untuk menggambar
        canvas.addEventListener('mousedown', (e) => {
            isDrawing = true;
            const rect = canvas.getBoundingClientRect();
            lastX = e.clientX - rect.left;
            lastY = e.clientY - rect.top;
        });
        
        canvas.addEventListener('mousemove', (e) => {
            if (!isDrawing) return;
            const rect = canvas.getBoundingClientRect();
            const currentX = e.clientX - rect.left;
            const currentY = e.clientY - rect.top;
            
            ctx.beginPath();
            ctx.moveTo(lastX, lastY);
            ctx.lineTo(currentX, currentY);
            ctx.stroke();
            
            lastX = currentX;
            lastY = currentY;
        });
        
        canvas.addEventListener('mouseup', () => {
            isDrawing = false;
            // Save signature data
            document.getElementById('signature_data').value = canvas.toDataURL('image/png');
        });
        
        canvas.addEventListener('mouseout', () => {
            isDrawing = false;
        });
        
        // Touch events for mobile
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const rect = canvas.getBoundingClientRect();
            const touch = e.touches[0];
            lastX = touch.clientX - rect.left;
            lastY = touch.clientY - rect.top;
            isDrawing = true;
        });
        
        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (!isDrawing) return;
            const rect = canvas.getBoundingClientRect();
            const touch = e.touches[0];
            const currentX = touch.clientX - rect.left;
            const currentY = touch.clientY - rect.top;
            
            ctx.beginPath();
            ctx.moveTo(lastX, lastY);
            ctx.lineTo(currentX, currentY);
            ctx.stroke();
            
            lastX = currentX;
            lastY = currentY;
        });
        
        canvas.addEventListener('touchend', () => {
            isDrawing = false;
            // Save signature data
            document.getElementById('signature_data').value = canvas.toDataURL('image/png');
        });
        
        // Clear signature
        const clearBtn = document.getElementById('clearSignature');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                document.getElementById('signature_data').value = '';
                showToast('Tanda tangan berhasil dihapus', 'info');
            });
        }
    }
    
    if (form) {
        const loadingIndicator = document.getElementById('loadingIndicator');
        form.addEventListener('submit', function(event) {
            // Validasi NIK (harus 16 digit angka)
            const nikInput = document.getElementById('nik');
            if (nikInput && nikInput.value) {
                // Hapus semua karakter non-digit
                const nikValue = nikInput.value.replace(/\D/g, '');
                
                if (nikValue.length !== 16) {
                    event.preventDefault();
                    showToast('NIK harus terdiri dari 16 digit angka', 'danger');
                    nikInput.focus();
                    return false;
                }
                
                // Update nilai dengan hanya digit
                nikInput.value = nikValue;
            }
            
            // Validasi format RT/RW (format 000/000)
            const rtRwInput = document.getElementById('rt_rw');
            if (rtRwInput && rtRwInput.value) {
                const rtRwRegex = /^\d{3}\/\d{3}$/;
                if (!rtRwRegex.test(rtRwInput.value)) {
                    event.preventDefault();
                    showToast('Format RT/RW harus 000/000', 'danger');
                    rtRwInput.focus();
                    return false;
                }
            }
            
            // Validasi ukuran file foto
            const photoInput = document.getElementById('pas_photo');
            if (photoInput && photoInput.files && photoInput.files.length > 0) {
                const fileSize = photoInput.files[0].size / 1024 / 1024; // dalam MB
                if (fileSize > 5) {
                    event.preventDefault();
                    showToast('Ukuran file foto tidak boleh lebih dari 5MB', 'danger');
                    return false;
                }
            }
            
            // Validasi tanda tangan
            const signatureInput = document.getElementById('signature_data');
            if (signatureInput && !signatureInput.value) {
                event.preventDefault();
                showToast('Silakan buat tanda tangan terlebih dahulu', 'danger');
                document.getElementById('signatureCanvas').scrollIntoView({ behavior: 'smooth' });
                return false;
            }
            
            // Tampilkan loading indicator
            if (loadingIndicator) {
                loadingIndicator.style.display = 'block';
                
                // Disable submit button
                const submitBtn = document.getElementById('submitBtn');
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Memproses...';
                }
            }
            
            return true;
        });
    }
    
    // Preview foto saat dipilih
    const photoInput = document.getElementById('pas_photo');
    if (photoInput) {
        photoInput.addEventListener('change', function() {
            if (this.files && this.files[0]) {
                const reader = new FileReader();
                
                reader.onload = function(e) {
                    // Jika ada elemen preview container
                    const previewContainer = document.getElementById('photo-preview-container');
                    if (previewContainer) {
                        // Clear previous preview
                        previewContainer.innerHTML = '';
                        
                        // Create preview
                        const previewWrapper = document.createElement('div');
                        previewWrapper.className = 'mt-3 text-center';
                        
                        const previewImage = document.createElement('img');
                        previewImage.src = e.target.result;
                        previewImage.className = 'img-thumbnail';
                        previewImage.style.height = '120px';
                        previewImage.style.width = 'auto';
                        
                        const previewCaption = document.createElement('p');
                        previewCaption.className = 'text-muted small mt-1';
                        previewCaption.textContent = 'Foto yang akan digunakan';
                        
                        previewWrapper.appendChild(previewImage);
                        previewWrapper.appendChild(previewCaption);
                        previewContainer.appendChild(previewWrapper);
                        
                        showToast('Foto berhasil diunggah', 'success');
                    }
                };
                
                reader.readAsDataURL(this.files[0]);
            }
        });
    }
    
    // Fungsi untuk menampilkan toast notification
    function showToast(message, type = 'info') {
        const toastContainer = document.querySelector('.toast-container');
        if (!toastContainer) return;
        
        const toastId = 'toast-' + Date.now();
        const bgClass = type === 'danger' ? 'bg-danger' : 
                        type === 'success' ? 'bg-success' : 
                        type === 'warning' ? 'bg-warning' : 'bg-info';
        
        const iconClass = type === 'danger' ? 'bi-exclamation-triangle-fill' : 
                           type === 'success' ? 'bi-check-circle-fill' : 
                           type === 'warning' ? 'bi-exclamation-circle-fill' : 'bi-info-circle-fill';
        
        const toastHtml = `
            <div id="${toastId}" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="toast-header ${bgClass} text-white">
                    <i class="bi ${iconClass} me-2"></i>
                    <strong class="me-auto">E-KTP Generator</strong>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
                <div class="toast-body">
                    ${message}
                </div>
            </div>
        `;
        
        toastContainer.insertAdjacentHTML('beforeend', toastHtml);
        
        const toastElement = document.getElementById(toastId);
        const toast = new bootstrap.Toast(toastElement, {
            autohide: true,
            delay: 3000
        });
        
        toast.show();
        
        // Remove toast from DOM after it's hidden
        toastElement.addEventListener('hidden.bs.toast', function() {
            toastElement.remove();
        });
    }
}); 