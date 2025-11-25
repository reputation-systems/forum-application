<script lang="ts">
    import { Button } from "$lib/components/ui/button/index.js";
    import { Input } from "$lib/components/ui/input/index.js";
    import { Label } from "$lib/components/ui/label/index.js";
    import { X } from "lucide-svelte";
    import {
        explorer_uri,
        web_explorer_uri_tx,
        web_explorer_uri_addr,
        web_explorer_uri_tkn,
    } from "$lib/ergo/envs";

    export let show = false;

    function close() {
        show = false;
    }
</script>

{#if show}
    <!-- Darker backdrop -->
    <button class="modal-backdrop" on:click={close} aria-label="Close settings"
    ></button>

    <div class="modal" role="dialog" aria-modal="true" aria-label="Settings">
        <div class="flex justify-between items-center mb-6">
            <h2 class="text-xl font-bold">Settings</h2>
            <Button variant="ghost" size="icon" on:click={close}
                ><X class="w-5 h-5" /></Button
            >
        </div>

        <div class="space-y-6">
            <div class="space-y-2">
                <Label for="explorer-api">Explorer API URI</Label>
                <Input
                    id="explorer-api"
                    bind:value={$explorer_uri}
                    placeholder="https://api.ergoplatform.com"
                />
                <p class="text-xs text-muted-foreground">
                    The base URL for the Ergo Explorer API.
                </p>
            </div>

            <div class="space-y-2">
                <Label for="web-tx">Transaction Explorer URL</Label>
                <Input
                    id="web-tx"
                    bind:value={$web_explorer_uri_tx}
                    placeholder="https://sigmaspace.io/en/transaction/"
                />
                <p class="text-xs text-muted-foreground">
                    URL prefix for viewing transactions.
                </p>
            </div>

            <div class="space-y-2">
                <Label for="web-addr">Address Explorer URL</Label>
                <Input
                    id="web-addr"
                    bind:value={$web_explorer_uri_addr}
                    placeholder="https://sigmaspace.io/en/address/"
                />
                <p class="text-xs text-muted-foreground">
                    URL prefix for viewing addresses.
                </p>
            </div>

            <div class="space-y-2">
                <Label for="web-tkn">Token Explorer URL</Label>
                <Input
                    id="web-tkn"
                    bind:value={$web_explorer_uri_tkn}
                    placeholder="https://sigmaspace.io/en/token/"
                />
                <p class="text-xs text-muted-foreground">
                    URL prefix for viewing tokens.
                </p>
            </div>
        </div>

        <div class="mt-8 flex justify-end">
            <Button on:click={close}>Done</Button>
        </div>
    </div>
{/if}

<style lang="postcss">
    .modal-backdrop {
        @apply fixed inset-0 bg-black/80 z-[70] cursor-default;
    }

    .modal {
        @apply fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
        bg-card border border-border rounded-xl p-6 w-full max-w-md z-[80] shadow-2xl;
        background-color: var(--card);
    }
</style>
