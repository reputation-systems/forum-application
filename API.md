# Forum Component

Componente Forum parametrizable para la librería de reputación de Ergo.

## Props

### Requeridas
- `topic_id: string` - ID del topic/proyecto a discutir

### Opcionales - Stores de configuración
Puedes pasar tus propios stores de Svelte para controlar la configuración:

- `spam_limit: Writable<string> | null` - Store para el límite de spam (default: "0")
- `web_explorer_uri_tx: Writable<string> | null` - Store para URI del explorador de transacciones
- `web_explorer_uri_addr: Writable<string> | null` - Store para URI del explorador de direcciones
- `web_explorer_uri_tkn: Writable<string> | null` - Store para URI del explorador de tokens
- `explorer_uri: Writable<string> | null` - Store para URI de la API del explorador

### Opcionales - Estilos y UI
- `maxWidth: string` - Ancho máximo del componente (default: "100%")
- `showTopicInput: boolean` - Mostrar input para cambiar topic (default: false)
- `showSpamToggle: boolean` - Mostrar botón para mostrar/ocultar spam (default: true)
- `showTopicScore: boolean` - Mostrar score del topic (default: true)

### Compatibilidad
- `profile: any | null` - Perfil de reputación (opcional)
- `connect_executed: boolean` - Si la conexión de wallet fue ejecutada (default: false)

## Ejemplo de Uso Básico

```svelte
<script>
  import { Forum } from 'forum-application';
  
  let topicId = "716f6e863f744b9ac22c97ec7b76ea5f5908bc5b2f67c61510bfc4751384ea7a";
</script>

<Forum 
  topic_id={topicId}
  maxWidth="800px"
/>
```

## Ejemplo con Stores Personalizados

```svelte
<script>
  import { Forum } from 'forum-application';
  import { writable } from 'svelte/store';
  
  let topicId = "716f6e863f744b9ac22c97ec7b76ea5f5908bc5b2f67c61510bfc4751384ea7a";
  
  // Tus propios stores
  const mySpamLimit = writable("5");
  const myExplorerTx = writable("https://explorer.ergoplatform.com/en/transactions/");
  const myExplorerApi = writable("https://api.ergoplatform.com");
</script>

<Forum 
  topic_id={topicId}
  spam_limit={mySpamLimit}
  web_explorer_uri_tx={myExplorerTx}
  explorer_uri={myExplorerApi}
  maxWidth="1200px"
  showTopicInput={false}
/>

<!-- Puedes modificar los stores desde tu aplicación -->
<button on:click={() => $mySpamLimit = "10"}>
  Cambiar límite de spam a 10
</button>
```

## Ejemplo Minimalista

```svelte
<script>
  import { Forum } from 'forum-application';
  
  let topicId = "716f6e863f744b9ac22c97ec7b76ea5f5908bc5b2f67c61510bfc4751384ea7a";
</script>

<Forum 
  topic_id={topicId}
  showTopicInput={false}
  showSpamToggle={false}
  maxWidth="600px"
/>
```

## Características

- **Totalmente parametrizable**: Controla todos los aspectos del componente mediante props
- **Stores reactivos**: Usa stores de Svelte para configuración dinámica
- **Estilos personalizables**: Controla el ancho y visibilidad de elementos
- **Compatible**: Mantiene compatibilidad con props legacy
- **Autónomo**: Usa valores por defecto si no se proveen stores

## Notas

- Si no se proveen stores personalizados, el componente usa stores locales con valores por defecto
- El componente requiere que el usuario tenga una wallet de Ergo conectada para interactuar
- Los cambios en los stores se reflejan inmediatamente en el componente
