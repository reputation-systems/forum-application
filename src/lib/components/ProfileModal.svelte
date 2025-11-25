<script lang="ts">
    import { Button } from "$lib/components/ui/button/index.js";
    import { X, User, Copy, ExternalLink } from "lucide-svelte";
    import { createProfileBox } from "$lib/ergo/commentStore";
    import { fetchProfile } from "$lib/ergo/commentFetch";
    import { web_explorer_uri_tx } from "$lib/ergo/envs";
    import type { ReputationProof } from "$lib/ergo/object";

    export let show = false;
    export let profile: ReputationProof | null = null;
    export let profile_creation_tx = "";

    let isCreating = false;

    async function handleCreateProfile() {
        if (!profile) {
            isCreating = true;
            try {
                profile_creation_tx = await createProfileBox();
                // We need 'ergo' global here. It's available in window/global scope in this app context
                // but might be safer to pass it or assume it exists if connected.
                if (typeof ergo !== "undefined") {
                    profile = await fetchProfile(ergo);
                }
                show = false;
            } catch (e) {
                console.error(e);
            } finally {
                isCreating = false;
            }
        }
    }

    function close() {
        show = false;
    }

    function copyToClipboard(text: string) {
        navigator.clipboard.writeText(text);
        // Could add toast here
    }
</script>

{#if show}
    <button class="modal-backdrop" on:click={close} aria-label="Close profile"
    ></button>

    <div class="modal" role="dialog" aria-modal="true" aria-label="Profile">
        <div class="flex justify-between items-center mb-6">
            <div class="flex items-center gap-2">
                <div class="p-2 bg-primary/10 rounded-full text-primary">
                    <User class="w-5 h-5" />
                </div>
                <h2 class="text-xl font-bold">Your Profile</h2>
            </div>
            <Button variant="ghost" size="icon" on:click={close}
                ><X class="w-5 h-5" /></Button
            >
        </div>

        {#if profile}
            <div class="space-y-6">
                <div
                    class="p-4 bg-muted/50 rounded-lg border border-border space-y-3"
                >
                    <div class="flex justify-between items-start">
                        <div>
                            <p
                                class="text-xs font-medium text-muted-foreground uppercase tracking-wider"
                            >
                                Reputation Token ID
                            </p>
                            <p class="font-mono text-sm mt-1 break-all">
                                {profile.token_id}
                            </p>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            class="h-6 w-6"
                            on:click={() =>
                                copyToClipboard(profile?.token_id || "")}
                        >
                            <Copy class="w-3 h-3" />
                        </Button>
                    </div>
                </div>

                <div>
                    <h3 class="text-sm font-semibold mb-3">Current State</h3>
                    {#if typeof profile.current_boxes?.[0]?.content === "object" && profile.current_boxes[0].content !== null}
                        <div
                            class="rounded-lg border border-border overflow-hidden"
                        >
                            <table class="w-full text-sm">
                                <thead class="bg-muted/50">
                                    <tr>
                                        <th
                                            class="px-4 py-2 text-left font-medium text-muted-foreground border-b border-border"
                                            >Key</th
                                        >
                                        <th
                                            class="px-4 py-2 text-left font-medium text-muted-foreground border-b border-border"
                                            >Value</th
                                        >
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-border">
                                    {#each Object.entries(profile.current_boxes[0].content) as [key, value]}
                                        <tr
                                            class="bg-card hover:bg-muted/20 transition-colors"
                                        >
                                            <td
                                                class="px-4 py-3 font-mono text-xs text-muted-foreground"
                                                >{key.toUpperCase()}</td
                                            >
                                            <td
                                                class="px-4 py-3 font-mono text-xs break-all"
                                            >
                                                {typeof value === "object"
                                                    ? JSON.stringify(
                                                          value,
                                                          null,
                                                          2,
                                                      )
                                                    : value}
                                            </td>
                                        </tr>
                                    {/each}
                                </tbody>
                            </table>
                        </div>
                    {:else if profile.current_boxes?.[0]?.content}
                        <div
                            class="bg-muted p-4 rounded-lg text-sm font-mono break-all"
                        >
                            {profile.current_boxes[0].content}
                        </div>
                    {:else}
                        <p class="text-sm text-muted-foreground italic">
                            No content available in your reputation box.
                        </p>
                    {/if}
                </div>
            </div>
        {:else}
            <div class="text-center py-8 space-y-4">
                <div
                    class="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4"
                >
                    <User class="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 class="text-lg font-semibold">No Profile Found</h3>
                <p class="text-muted-foreground text-sm max-w-xs mx-auto">
                    Create a reputation profile to start posting comments and
                    building your trust score on the network.
                </p>
                <Button
                    class="w-full max-w-xs"
                    on:click={handleCreateProfile}
                    disabled={isCreating}
                >
                    {isCreating
                        ? "Creating Profile..."
                        : "Create Reputation Profile"}
                </Button>
            </div>
        {/if}

        {#if profile_creation_tx}
            <div
                class="mt-6 p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-3"
            >
                <div class="flex-1 min-w-0">
                    <p
                        class="text-xs font-medium text-green-600 dark:text-green-400"
                    >
                        Profile Creation Transaction
                    </p>
                    <p class="text-xs text-muted-foreground truncate">
                        {profile_creation_tx}
                    </p>
                </div>
                <a
                    href={`${$web_explorer_uri_tx}${profile_creation_tx}`}
                    target="_blank"
                    class="p-2 hover:bg-green-500/10 rounded-full transition-colors"
                >
                    <ExternalLink
                        class="w-4 h-4 text-green-600 dark:text-green-400"
                    />
                </a>
            </div>
        {/if}
    </div>
{/if}

<style lang="postcss">
    .modal-backdrop {
        @apply fixed inset-0 bg-black/80 z-[70] cursor-default;
    }

    .modal {
        @apply fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
        bg-card border border-border rounded-xl p-6 w-full max-w-lg z-[80] shadow-2xl;
        background-color: var(--card);
    }
</style>
