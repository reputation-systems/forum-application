# Forum Component

The configurable Forum component for the Ergo reputation library.

## Props

### Required

  - `topic_id: string` - ID of the topic/project to discuss.

### Optional - Configuration Stores

You can pass your own Svelte stores to control the configuration:

  - `spam_limit: Writable<string> | null` - Store for the spam limit (default: "0").
  - `web_explorer_uri_tx: Writable<string> | null` - Store for the transaction explorer URI.
  - `web_explorer_uri_addr: Writable<string> | null` - Store for the address explorer URI.
  - `web_explorer_uri_tkn: Writable<string> | null` - Store for the token explorer URI.
  - `explorer_uri: Writable<string> | null` - Store for the explorer API URI.

### Optional - Styles and UI

  - `maxWidth: string` - Maximum width of the component (default: `"100%"`).
  - `showTopicInput: boolean` - Show input field to change the topic (default: `false`).
  - `showSpamToggle: boolean` - Show button to toggle displaying/hiding spam (default: `true`).
  - `showTopicScore: boolean` - Show the topic score (default: `true`).

### Compatibility

  - `profile: any | null` - Reputation profile (optional).
  - `connect_executed: boolean` - Whether wallet connection has been executed (default: `false`).
  - `connected: boolean` - Whether the wallet is currently connected (default: `false`).

## Basic Usage Example

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

## Example with Custom Stores

```svelte
<script>
  import { Forum } from 'forum-application';
  import { writable } from 'svelte/store';
  
  let topicId = "716f6e863f744b9ac22c97ec7b76ea5f5908bc5b2f67c61510bfc4751384ea7a";
  
  // Your custom stores
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

<button on:click={() => $mySpamLimit = "10"}>
  Change Spam Limit to 10
</button>
```

## Minimalist Example

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

## Features

  * **Fully Configurable**: Control all aspects of the component via props.
  * **Reactive Stores**: Use Svelte stores for dynamic configuration.
  * **Customizable Styles**: Control the width and visibility of elements.
  * **Compatible**: Maintains compatibility with legacy props.
  * **Autonomous**: Uses default values if no stores are provided.

## Notes

  * If custom stores are not provided, the component uses local stores with default values.
  * The component requires the user to have an Ergo wallet connected for interaction.
  * Changes in the stores are immediately reflected in the component.
