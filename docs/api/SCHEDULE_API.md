# Guía Frontend - Sistema de Generación de Horarios

## Descripción

Esta guía proporciona ejemplos de implementación frontend para integrar el nuevo sistema de generación de horarios con rango personalizable. Incluye ejemplos en JavaScript vanilla, React, y Angular.

## Configuración Base

### Headers de Autenticación
Todos los endpoints requieren autenticación JWT:

```javascript
const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${jwtToken}`
};
```

### URL Base
```javascript
const API_BASE_URL = 'http://localhost:8080'; // Ajustar según entorno
```

## Endpoint 1: Generar Horarios para Fecha Específica

### JavaScript Vanilla

```javascript
async function generateSchedulesForDate(targetDate, startHour = null, endHour = null, productIds = null) {
    try {
        const requestBody = {
            target_date: targetDate
        };
        
        // Agregar parámetros opcionales si se especifican
        if (startHour !== null) requestBody.start_hour = parseInt(startHour);
        if (endHour !== null) requestBody.end_hour = parseInt(endHour);
        if (productIds && productIds.length > 0) requestBody.product_ids = productIds;

        const response = await fetch(`${API_BASE_URL}/schedules/generate/date`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('Horarios generados:', result);
        
        // Mostrar mensaje de éxito
        showSuccessMessage(result.message);
        return result;
        
    } catch (error) {
        console.error('Error generando horarios:', error);
        showErrorMessage('Error al generar horarios: ' + error.message);
        throw error;
    }
}

// Ejemplo de uso
document.getElementById('generateBtn').addEventListener('click', async () => {
    const dateInput = document.getElementById('targetDate');
    const targetDate = dateInput.value;
    
    if (!targetDate) {
        showErrorMessage('Por favor selecciona una fecha');
        return;
    }
    
    // Generar horarios para todos los productos SERVICE de categoría "Alquiler de Canchas"
    // con horario por defecto (14:00-23:00, incluye slot 22:00-23:00)
    await generateSchedulesForDate(targetDate);
});

// Ejemplo con parámetros personalizados
document.getElementById('generateCustomBtn').addEventListener('click', async () => {
    const dateInput = document.getElementById('targetDate');
    const startHour = document.getElementById('startHour');
    const endHour = document.getElementById('endHour');
    const productSelect = document.getElementById('productIds');
    
    const targetDate = dateInput.value;
    const selectedProducts = Array.from(productSelect.selectedOptions).map(option => option.value);
    
    if (!targetDate) {
        showErrorMessage('Por favor selecciona una fecha');
        return;
    }
    
    // Generar horarios con parámetros personalizados
    await generateSchedulesForDate(
        targetDate,
        startHour.value || null,
        endHour.value || null,
        selectedProducts.length > 0 ? selectedProducts : null
    );
});
```

### React Hook

```jsx
import { useState, useCallback } from 'react';

export const useScheduleGeneration = (authToken) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const generateSchedulesForDate = useCallback(async (targetDate, startHour = null, endHour = null, productIds = null) => {
        setLoading(true);
        setError(null);

        try {
            const requestBody = {
                target_date: targetDate
            };
            
            // Agregar parámetros opcionales si se especifican
            if (startHour !== null) requestBody.start_hour = parseInt(startHour);
            if (endHour !== null) requestBody.end_hour = parseInt(endHour);
            if (productIds && productIds.length > 0) requestBody.product_ids = productIds;

            const response = await fetch(`${API_BASE_URL}/schedules/generate/date`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            return result;

        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [authToken]);

    return {
        generateSchedulesForDate,
        loading,
        error
    };
};

// Componente de ejemplo
const ScheduleGenerator = () => {
    const [targetDate, setTargetDate] = useState('');
    const [startHour, setStartHour] = useState('');
    const [endHour, setEndHour] = useState('');
    const [selectedProducts, setSelectedProducts] = useState([]);
    const { generateSchedulesForDate, loading, error } = useScheduleGeneration(authToken);

    const productOptions = [
        { value: 'BT_Cancha_1_xyz123abc', label: 'Cancha 1' },
        { value: 'BT_Cancha_2_def456ghi', label: 'Cancha 2' },
        { value: 'CANCHA-01', label: 'Cancha de Beach Tennis' }
    ];

    const generateHourOptions = (start, end) => {
        const options = [];
        for (let i = start; i <= end; i++) {
            options.push(
                <option key={i} value={i}>{i}:00</option>
            );
        }
        return options;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!targetDate) {
            alert('Por favor selecciona una fecha');
            return;
        }

        try {
            const result = await generateSchedulesForDate(
                targetDate,
                startHour || null,
                endHour || null,
                selectedProducts.length > 0 ? selectedProducts : null
            );
            alert(result.message);
        } catch (err) {
            alert('Error: ' + err.message);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <div>
                <label htmlFor="targetDate">Fecha:</label>
                <input
                    type="date"
                    id="targetDate"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    required
                />
            </div>
            
            <div>
                <label htmlFor="startHour">Hora de inicio (opcional):</label>
                <select
                    id="startHour"
                    value={startHour}
                    onChange={(e) => setStartHour(e.target.value)}
                >
                    <option value="">Por defecto (14:00)</option>
                    {generateHourOptions(0, 21)}
                </select>
            </div>
            
            <div>
                <label htmlFor="endHour">Hora de fin (opcional):</label>
                <select
                    id="endHour"
                    value={endHour}
                    onChange={(e) => setEndHour(e.target.value)}
                >
                    <option value="">Por defecto (23:00)</option>
                    {generateHourOptions(1, 23)}
                </select>
            </div>
            
            <div>
                <label htmlFor="productIds">Productos específicos (opcional):</label>
                <select
                    id="productIds"
                    multiple
                    value={selectedProducts}
                    onChange={(e) => setSelectedProducts(Array.from(e.target.selectedOptions, option => option.value))}
                    className="multi-select"
                >
                    {productOptions.map(option => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
                <small>Sin seleccionar = todos los productos SERVICE de "Alquiler de Canchas"</small>
            </div>
            
            <button type="submit" disabled={loading}>
                {loading ? 'Generando...' : 'Generar Horarios'}
            </button>
            
            {error && <div className="error">{error}</div>}
        </form>
    );
};
```

### Angular Service

```typescript
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface GenerateScheduleRequest {
    target_date: string;
    start_hour?: number;    // Opcional, por defecto 14
    end_hour?: number;      // Opcional, por defecto 22
    product_ids?: string[]; // Opcional, auto-descubre si no se especifica
}

export interface GenerateScheduleResponse {
    success: boolean;
    target_date: string;
    auto_discovery: boolean;
    time_range: {
        start_hour: number;
        end_hour: number;
        total_hours: number;
    };
    validation: {
        products_requested: number;
        valid_products: number;
        invalid_products: number;
        requirements: {
            product_type: string;
            category_required: string;
            status_required: string;
        };
    };
    product_ids_processed: string[];
    results: {
        schedules_created: number;
        schedules_skipped: number;
        errors_count: number;
        invalid_products_count: number;
    };
    errors: string[];
    message: string;
    generated_at: string;
}

@Injectable({
    providedIn: 'root'
})
export class ScheduleService {
    private apiUrl = 'http://localhost:8080';

    constructor(private http: HttpClient) {}

    private getHeaders(token: string): HttpHeaders {
        return new HttpHeaders({
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        });
    }

    generateSchedulesForDate(
        targetDate: string, 
        token: string,
        startHour?: number,
        endHour?: number,
        productIds?: string[]
    ): Observable<GenerateScheduleResponse> {
        const headers = this.getHeaders(token);
        const body: GenerateScheduleRequest = {
            target_date: targetDate
        };
        
        // Agregar parámetros opcionales si se especifican
        if (startHour !== undefined) body.start_hour = startHour;
        if (endHour !== undefined) body.end_hour = endHour;
        if (productIds && productIds.length > 0) body.product_ids = productIds;

        return this.http.post<GenerateScheduleResponse>(
            `${this.apiUrl}/schedules/generate/date`,
            body,
            { headers }
        );
    }
}

// Componente de ejemplo
import { Component } from '@angular/core';
import { ScheduleService } from './schedule.service';

@Component({
    selector: 'app-schedule-generator',
    template: `
        <form (ngSubmit)="onSubmit()">
            <div>
                <label for="targetDate">Fecha:</label>
                <input 
                    type="date" 
                    id="targetDate"
                    [(ngModel)]="targetDate"
                    [min]="minDate"
                    required
                />
            </div>
            
            <div>
                <label for="startHour">Hora de inicio (opcional):</label>
                <select id="startHour" [(ngModel)]="startHour">
                    <option value="">Por defecto (14:00)</option>
                    <option *ngFor="let hour of hours" [value]="hour">{{hour}}:00</option>
                </select>
            </div>
            
            <div>
                <label for="endHour">Hora de fin (opcional):</label>
                <select id="endHour" [(ngModel)]="endHour">
                    <option value="">Por defecto (23:00)</option>
                    <option *ngFor="let hour of hours" [value]="hour">{{hour}}:00</option>
                </select>
            </div>
            
            <div>
                <label for="productIds">Productos específicos (opcional):</label>
                <select id="productIds" [(ngModel)]="selectedProducts" multiple>
                    <option value="BT_Cancha_1_xyz123abc">Cancha 1</option>
                    <option value="BT_Cancha_2_def456ghi">Cancha 2</option>
                    <option value="CANCHA-01">Cancha de Beach Tennis</option>
                </select>
                <small>Sin seleccionar = todos los productos SERVICE de "Alquiler de Canchas"</small>
            </div>
            
            <button type="submit" [disabled]="loading">
                {{ loading ? 'Generando...' : 'Generar Horarios' }}
            </button>
            
            <div *ngIf="error" class="error">{{ error }}</div>
            <div *ngIf="successMessage" class="success">{{ successMessage }}</div>
        </form>
    `
})
export class ScheduleGeneratorComponent {
    targetDate: string = '';
    startHour: string = '';
    endHour: string = '';
    selectedProducts: string[] = [];
    loading = false;
    error: string | null = null;
    successMessage: string | null = null;
    minDate = new Date().toISOString().split('T')[0];
    hours = Array.from({length: 24}, (_, i) => i);

    constructor(
        private scheduleService: ScheduleService,
        private authToken: string // Inyectar token de auth
    ) {}

    onSubmit() {
        if (!this.targetDate) {
            this.error = 'Por favor selecciona una fecha';
            return;
        }

        this.loading = true;
        this.error = null;
        this.successMessage = null;

        const startHour = this.startHour ? parseInt(this.startHour) : undefined;
        const endHour = this.endHour ? parseInt(this.endHour) : undefined;
        const productIds = this.selectedProducts.length > 0 ? this.selectedProducts : undefined;

        this.scheduleService.generateSchedulesForDate(
            this.targetDate, 
            this.authToken,
            startHour,
            endHour,
            productIds
        ).subscribe({
            next: (result) => {
                this.successMessage = result.message;
                this.loading = false;
            },
            error: (err) => {
                this.error = 'Error: ' + err.message;
                this.loading = false;
            }
        });
    }
}
```

## Endpoint: Generar Horarios con Parámetros Flexibles

La función `generate_schedules_for_date` ahora soporta **auto-descubrimiento** de productos. Si no se especifican `product_ids`, automáticamente generará horarios para **todos** los productos de tipo SERVICE activos en la categoría "Alquiler de Canchas".

### Parámetros de la Función

- **`target_date`** (requerido): Fecha para generar horarios
- **`start_hour`** (opcional): Hora de inicio (por defecto: 14)
- **`end_hour`** (opcional): Hora de fin (por defecto: 23) - incluye el slot hasta esta hora
- **`product_ids`** (opcional): Array de IDs de productos específicos

### Comportamiento

1. **Sin `product_ids`**: Auto-descubre todos los productos SERVICE de categoría "Alquiler de Canchas"
2. **Con `product_ids`**: Valida que sean SERVICE y de la categoría correcta
3. **Validaciones**: Solo productos activos, tipo SERVICE, categoría "Alquiler de Canchas"
4. **Rango de horarios**: Genera slots de 1 hora desde `start_hour` hasta `end_hour-1:00 a end_hour:00`

**Ejemplo**: Con `start_hour=14` y `end_hour=23`, genera 9 horarios:
- 14:00-15:00, 15:00-16:00, ..., 21:00-22:00, **22:00-23:00**

### JavaScript Vanilla Completo

```javascript
async function generateSchedulesWithOptions(targetDate, options = {}) {
    try {
        const requestBody = {
            target_date: targetDate
        };
        
        // Agregar parámetros opcionales
        if (options.startHour !== undefined) requestBody.start_hour = parseInt(options.startHour);
        if (options.endHour !== undefined) requestBody.end_hour = parseInt(options.endHour);
        if (options.productIds && options.productIds.length > 0) requestBody.product_ids = options.productIds;

        const response = await fetch(`${API_BASE_URL}/schedules/generate/date`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('Horarios generados:', result);
        
        // Mensaje detallado
        const message = result.auto_discovery 
            ? `Auto-descubrimiento: ${result.message} (${result.validation.products_requested} productos encontrados)`
            : result.message;
            
        showSuccessMessage(message);
        return result;
        
    } catch (error) {
        console.error('Error generando horarios:', error);
        showErrorMessage('Error al generar horarios: ' + error.message);
        throw error;
    }
}

// Ejemplos de uso:

// 1. Generar para todos los productos SERVICE de "Alquiler de Canchas" (auto-descubrimiento)
await generateSchedulesWithOptions('2025-09-16');

// 2. Con horario personalizado - ahora incluye 22:00-23:00
await generateSchedulesWithOptions('2025-09-16', {
    startHour: 8,
    endHour: 23  // Genera hasta 22:00-23:00
});

// 3. Para productos específicos
await generateSchedulesWithOptions('2025-09-16', {
    productIds: ['BT_Cancha_1_xyz123abc', 'BT_Cancha_2_def456ghi']
});

// 4. Combinación completa
await generateSchedulesWithOptions('2025-09-16', {
    startHour: 10,
    endHour: 18,
    productIds: ['BT_Cancha_1_xyz123abc']
});

// Formulario HTML de ejemplo
const scheduleForm = `
<form id="scheduleForm">
    <div>
        <label for="targetDate">Fecha:</label>
        <input type="date" id="targetDate" required>
    </div>
    
    <div>
        <label for="startHour">Hora de inicio (opcional):</label>
        <select id="startHour">
            <option value="">Por defecto (14:00)</option>
            ${generateHourOptions(0, 21)}
        </select>
    </div>
    
    <div>
        <label for="endHour">Hora de fin (opcional):</label>
        <select id="endHour">
            <option value="">Por defecto (23:00)</option>
            ${generateHourOptions(1, 23)}
        </select>
    </div>
    
    <div>
        <label for="productIds">Productos específicos (opcional):</label>
        <select id="productIds" multiple>
            <option value="BT_Cancha_1_xyz123abc">Cancha 1</option>
            <option value="BT_Cancha_2_def456ghi">Cancha 2</option>
            <option value="CANCHA-01">Cancha de Beach Tennis</option>
        </select>
        <small>Sin seleccionar = todos los productos SERVICE de "Alquiler de Canchas"</small>
    </div>
    
    <button type="submit">Generar Horarios</button>
</form>
`;

function generateHourOptions(start, end) {
    let options = '';
    for (let i = start; i <= end; i++) {
        options += `<option value="${i}">${i}:00</option>`;
    }
    return options;
}

// Event listener para el formulario
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('scheduleForm');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const targetDate = document.getElementById('targetDate').value;
        const startHour = document.getElementById('startHour').value;
        const endHour = document.getElementById('endHour').value;
        const productSelect = document.getElementById('productIds');
        const productIds = Array.from(productSelect.selectedOptions).map(option => option.value);
        
        // Validaciones
        if (startHour && endHour && parseInt(startHour) >= parseInt(endHour)) {
            showErrorMessage('La hora de inicio debe ser menor que la hora de fin');
            return;
        }
        
        const options = {};
        if (startHour) options.startHour = parseInt(startHour);
        if (endHour) options.endHour = parseInt(endHour);
        if (productIds.length > 0) options.productIds = productIds;
        
        await generateSchedulesWithOptions(targetDate, options);
    });
});
```

### React Component Completo

```jsx
import React, { useState } from 'react';

const ScheduleGenerator = ({ authToken }) => {
    const [formData, setFormData] = useState({
        targetDate: '',
        startHour: '',
        endHour: '',
        productIds: []
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const productOptions = [
        { value: 'BT_Cancha_1_xyz123abc', label: 'Cancha 1' },
        { value: 'BT_Cancha_2_def456ghi', label: 'Cancha 2' },
        { value: 'CANCHA-01', label: 'Cancha de Beach Tennis' }
    ];

    const generateHourOptions = (start, end) => {
        const options = [];
        for (let i = start; i <= end; i++) {
            options.push(
                <option key={i} value={i}>{i}:00</option>
            );
        }
        return options;
    };

    const handleInputChange = (e) => {
        const { name, value, type } = e.target;
        
        if (type === 'select-multiple') {
            const selectedValues = Array.from(e.target.selectedOptions, option => option.value);
            setFormData(prev => ({
                ...prev,
                [name]: selectedValues
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        // Validaciones
        if (!formData.targetDate) {
            setError('Por favor selecciona una fecha');
            return;
        }

        if (formData.startHour && formData.endHour && 
            parseInt(formData.startHour) >= parseInt(formData.endHour)) {
            setError('La hora de inicio debe ser menor que la hora de fin');
            return;
        }

        setLoading(true);

        try {
            const requestBody = {
                target_date: formData.targetDate
            };

            // Agregar parámetros opcionales
            if (formData.startHour) requestBody.start_hour = parseInt(formData.startHour);
            if (formData.endHour) requestBody.end_hour = parseInt(formData.endHour);
            if (formData.productIds.length > 0) requestBody.product_ids = formData.productIds;

            const response = await fetch('/schedules/generate/date', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            
            // Mensaje detallado basado en auto-descubrimiento
            const detailedMessage = result.auto_discovery 
                ? `${result.message} (Auto-descubrimiento: ${result.validation.products_requested} productos)`
                : result.message;
                
            setMessage(detailedMessage);
            
            // Limpiar formulario
            setFormData({
                targetDate: '',
                startHour: '',
                endHour: '',
                productIds: []
            });

        } catch (err) {
            setError('Error: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="schedule-generator">
            <h3>Generador de Horarios Inteligente</h3>
            <p>Sin productos específicos = auto-descubre todos los productos SERVICE de "Alquiler de Canchas"</p>
            
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="targetDate">Fecha:</label>
                    <input
                        type="date"
                        id="targetDate"
                        name="targetDate"
                        value={formData.targetDate}
                        onChange={handleInputChange}
                        min={new Date().toISOString().split('T')[0]}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="startHour">Hora de inicio (opcional):</label>
                    <select
                        id="startHour"
                        name="startHour"
                        value={formData.startHour}
                        onChange={handleInputChange}
                    >
                        <option value="">Por defecto (14:00)</option>
                        {generateHourOptions(0, 21)}
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="endHour">Hora de fin (opcional):</label>
                    <select
                        id="endHour"
                        name="endHour"
                        value={formData.endHour}
                        onChange={handleInputChange}
                    >
                        <option value="">Por defecto (23:00)</option>
                        {generateHourOptions(1, 23)}
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="productIds">Productos específicos (opcional):</label>
                    <select
                        id="productIds"
                        name="productIds"
                        multiple
                        value={formData.productIds}
                        onChange={handleInputChange}
                        className="multi-select"
                    >
                        {productOptions.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                    <small>Sin seleccionar = todos los productos SERVICE de "Alquiler de Canchas"</small>
                </div>

                <button type="submit" disabled={loading}>
                    {loading ? 'Generando...' : 'Generar Horarios'}
                </button>
            </form>

            {message && (
                <div className="alert alert-success">
                    {message}
                </div>
            )}

            {error && (
                <div className="alert alert-error">
                    {error}
                </div>
            )}
        </div>
    );
};

export default ScheduleGenerator;
```

## Utilidades y Helpers

### Validación de Fechas

```javascript
function validateDate(dateString) {
    const today = new Date();
    const selectedDate = new Date(dateString);
    
    // Verificar que la fecha no sea en el pasado
    if (selectedDate < today.setHours(0, 0, 0, 0)) {
        throw new Error('No se pueden generar horarios para fechas pasadas');
    }
    
    // Verificar formato
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateString)) {
        throw new Error('Formato de fecha inválido. Use YYYY-MM-DD');
    }
    
    return true;
}
```

### Formateo de Respuestas

```javascript
function formatScheduleResponse(response) {
    return {
        success: response.success,
        message: response.message,
        autoDiscovery: response.auto_discovery,
        details: {
            date: response.target_date,
            timeRange: `${response.time_range.start_hour}:00 - ${response.time_range.end_hour}:00`,
            totalHours: response.time_range.total_hours,
            productsProcessed: response.validation.products_requested,
            validProducts: response.validation.valid_products,
            invalidProducts: response.validation.invalid_products
        },
        results: {
            schedulesCreated: response.results.schedules_created,
            schedulesSkipped: response.results.schedules_skipped,
            errorsCount: response.results.errors_count
        },
        validation: {
            requirements: response.validation.requirements,
            productIds: response.product_ids_processed || []
        },
        errors: response.errors || []
    };
}
```

### Manejo de Errores

```javascript
function handleApiError(error) {
    console.error('API Error:', error);
    
    // Errores específicos
    if (error.message.includes('401')) {
        return 'Sesión expirada. Por favor inicia sesión nuevamente.';
    }
    
    if (error.message.includes('400')) {
        return 'Datos inválidos. Por favor verifica la información ingresada.';
    }
    
    if (error.message.includes('500')) {
        return 'Error interno del servidor. Por favor intenta más tarde.';
    }
    
    return 'Error inesperado: ' + error.message;
}
```

## CSS Sugerido

```css
.schedule-generator {
    max-width: 500px;
    margin: 0 auto;
    padding: 20px;
    border: 1px solid #ddd;
    border-radius: 8px;
    background: #f9f9f9;
}

.form-group {
    margin-bottom: 15px;
}

.form-group label {
    display: block;
    margin-bottom: 5px;
    font-weight: bold;
}

.form-group input,
.form-group select {
    width: 100%;
    padding: 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 14px;
}

.multi-select {
    height: 80px;
}

button {
    background: #007bff;
    color: white;
    padding: 10px 20px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 16px;
}

button:disabled {
    background: #6c757d;
    cursor: not-allowed;
}

.alert {
    padding: 10px;
    margin-top: 15px;
    border-radius: 4px;
}

.alert-success {
    background: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
}

.alert-error {
    background: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
}
```

## Mejores Prácticas

### 1. Manejo de Estado
- Usar estados de loading para mejorar UX
- Mostrar mensajes de error y éxito claramente
- Limpiar formularios después de envío exitoso

### 2. Validaciones
- Validar datos en el frontend antes de enviar
- Mostrar mensajes de validación específicos
- Prevenir fechas pasadas

### 3. Experiencia de Usuario
- Usar spinners o indicadores de loading
- Proporcionar feedback inmediato
- Permitir cancelación de operaciones largas

### 4. Seguridad
- Validar tokens JWT antes de cada request
- Manejar expiración de sesiones
- Sanitizar inputs del usuario

### 5. Performance
- Implementar debouncing para búsquedas
- Usar caché para datos frecuentemente accedidos
- Minimizar requests innecesarios

## Notas de Implementación

1. **Auto-descubrimiento**: Si no se especifican `product_ids`, la función automáticamente encuentra todos los productos SERVICE activos de categoría "Alquiler de Canchas"
2. **Tokens JWT**: Asegúrate de manejar la renovación de tokens apropiadamente
3. **Dates**: Usa siempre formato ISO (YYYY-MM-DD) para fechas
4. **Horas**: Las horas van de 0-23 (formato 24 horas), por defecto 14-23 (incluye slot 22:00-23:00)
5. **Validaciones**: Solo productos SERVICE, activos, y de categoría "Alquiler de Canchas"
6. **Errores**: Siempre maneja errores de red y de validación
7. **Loading States**: Implementa estados de loading para mejor UX
8. **Flexibilidad**: Un solo endpoint maneja tanto auto-descubrimiento como productos específicos
