# Tasks

## 1. Preparación de la pasada visual

- [ ] 1.1 Abrir el wireframe original junto con `/afiliacion`, confirmar que ambas referencias son visibles y registrar fidelidad como `NOT_VERIFIED` si falta la imagen; verificar que no se edite ningún archivo distinto de `frontend/src/pages/public/AffiliationPage.tsx`. **NOT_VERIFIED:** no se abrió navegador ni existe copia local del wireframe original.
- [x] 1.2 Identificar en `AffiliationPage.tsx` los bloques `AffiliationIntro`, `Stepper`, panel del `fieldset`, `IdentityStep`, `ContactStep`, `RequestStep`, estados Hacienda y acciones; verificar que la pasada no cambie hooks, schema, servicios, payload ni handlers.

## 2. Composición general y Stepper

- [x] 2.1 Ajustar localmente fondo, separación bajo navbar, cabecera, gutter y contenedor a máximo 1100 px con 24–32 px desktop, 24 px tablet y 16–20 px móvil; verificar en 1440, 1024, 768, 390 y 320 px que no exista overflow ni espacio superior excesivo.
- [x] 2.2 Reproducir tarjeta exterior y panel interior con paddings 20/16/12 px y 28–32/24/16 px, borde, radio y elevación institucionales; verificar por comparación lado a lado que existan exactamente dos niveles de superficie y que navbar/footer no cambien.
- [x] 2.3 Ajustar Stepper a tres columnas iguales, círculos de 36/34/32 px y conectores centrados, con títulos siempre visibles y descripciones solo desde 1024 px; verificar los estados futuro, activo y completado en cada paso sin habilitar navegación libre.

## 3. Pasos, estados y controles

- [x] 3.1 Implementar distribución de Identidad: `tipo / identificación / Hacienda` y tres nombres en desktop, dos columnas más estado completo en tablet y una columna en móvil; verificar estados idle, loading, found y unavailable, autocompletado editable y ausencia de compresión/overflow. Corrección posterior implementada: Nombre(s) y Primer apellido usan etiqueta local `inline-flex` con asterisco inmediato; Segundo apellido continúa opcional y los tres inputs conservan estructura vertical equivalente.
- [x] 3.2 Implementar distribución de Contacto: teléfono/correo en dos columnas y dirección completa, con stack móvil; verificar que `PhoneField` conserve selector, valor, descripción, error y comportamiento internacional.
- [x] 3.3 Implementar distribución de Solicitud: pares fecha/género y ocupación/lugar, más motivo completo, con stack móvil; verificar que `DatePicker`, Select y Textarea conserven valores, etiquetas, errores y operación por teclado.
- [x] 3.4 Normalizar visualmente Input, Select, PhoneField y DatePicker a 48 px, Textarea a mínimo 112 px y gaps a 20 px desktop/16 px menores usando solo clases locales; verificar alineación, foco visible, disabled y errores sin modificar primitives compartidos.
- [x] 3.5 Ajustar alertas y mensajes Hacienda a bloques compactos con icono y texto, junto a identificación en desktop y debajo en tablet/móvil; verificar que significado nunca dependa solo de color y que mensajes largos ajusten línea sin overflow.

## 4. Acciones y protección funcional

- [x] 4.1 Ajustar Cancelar/Regresar y Continuar/Enviar a extremos en desktop/tablet y ancho completo en móvil, con altura mínima de 44 px y variantes existentes; verificar jerarquía primaria/secundaria, orden de foco y estados disabled/loading.
- [x] 4.2 Revisar el diff lógico de `AffiliationPage.tsx` y confirmar sin cambios `useForm`, Zod, debounce de 500 ms, caché, `lookupSequence`, descarte de respuestas obsoletas, sanitización, `stepFields`, `form.trigger`, `submitLock`, mapeo, servicio y manejo de errores.
- [ ] 4.3 Ejecutar las pruebas enfocadas existentes de `AffiliationPage.test.tsx` y verificar navegación validada, persistencia de valores, envío único y payload sin regresiones; si no se ejecutan, registrar resultado `NOT_VERIFIED` sin declararlas aprobadas. **NOT_VERIFIED:** pruebas no ejecutadas por restricción de la ejecución.

## 5. Validación integral previa a revisión

- [ ] 5.1 Comparar lado a lado cada región contra el wireframe en 1440 y 1024 px: cabecera, fondo, ancho, Stepper, panel, campos, Hacienda, acciones y espacio al footer; verificar cumplimiento de medidas de `design.md` y registrar cualquier diferencia residual. **NOT_VERIFIED:** comparación visual no ejecutada; wireframe original no está disponible localmente.
- [ ] 5.2 Revisar 768, 390 y 320 px con cada paso y con errores visibles; verificar ausencia de overflow, Stepper legible, controles táctiles de al menos 44 px, orden DOM lógico y foco accesible. **NOT_VERIFIED:** revisión responsive y de foco no ejecutada en navegador.
- [x] 5.3 Confirmar que labels y asteriscos siguen Zod aunque difieran del wireframe, que ningún componente global/backend/Prisma/Auth/Finanzas fue modificado y que CU V2 permanece `NOT_VERIFIED` hasta contar con fuente inmutable.
