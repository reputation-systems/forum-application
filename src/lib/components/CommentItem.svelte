<script lang="ts">
    import { Button } from "$lib/components/ui/button/index.js";
    import { Textarea } from "$lib/components/ui/textarea";
    import { Label } from "$lib/components/ui/label/index.js";
    import { ThumbsUp, ThumbsDown, Reply } from "lucide-svelte"; // 💡 AGREGADO: Reply icon
    import { web_explorer_uri_tx, web_explorer_uri_tkn } from "$lib/ergo/envs";
    import { getScore, type Comment } from "$lib/ergo/commentObject";
    import { replyToComment, flagSpam } from "$lib/ergo/commentStore";
    import * as jdenticon from "jdenticon";
    import type { ReputationProof } from "$lib/ergo/object";

    export let comment: Comment;
    export let profile: ReputationProof | null = null;
    export let showAllComments = false;
    export let topic_id: string;
    export let connect_executed = false;
    export let _parentId: string | undefined = undefined;
    export let allCommentsFlatProfilesMap: Record<string, string> = {};

    export let repliesMap: Record<string, string[]> = {};
    export let allCommentsFlatMap: Record<
        string,
        Comment & { _parentId?: string }
    > = {};

    let replyText = "";
    let isReplying = false;
    let isFlagging = false;
    let commentError: string | null = null;
    let showReplyForm = false;
    let replySentiment: boolean | null = null;

    $: parentComment = _parentId ? allCommentsFlatMap[_parentId] : undefined;

    function getAvatarSvg(tokenId: string, size = 40): string {
        return jdenticon.toSvg(tokenId, size);
    }

    async function handleReply() {
        if (!replyText.trim() || !comment || replySentiment === null) return;

        isReplying = true;
        commentError = null;
        try {
            await replyToComment(comment.id, replyText, replySentiment);
            replyText = "";
            replySentiment = null;
            showReplyForm = false;
        } catch (err: any) {
            commentError = err.message || "Error sending reply.";
        } finally {
            isReplying = false;
        }
    }

    async function handleFlag() {
        if (!comment) return;
        isFlagging = true;
        await flagSpam(comment.id);
        isFlagging = false;
    }
</script>

<div class="comment-container" id="comment-{comment.id}">
    <div class="flex justify-between items-center mb-2">
        <div class="flex items-center gap-4">
            <a
                href="{web_explorer_uri_tkn}{comment.authorProfileTokenId}"
                target="_blank"
                rel="noopener noreferrer"
                class="flex items-center gap-2 group hover:underline"
            >
                <div class="avatar w-10 h-10 rounded-full overflow-hidden">
                    {@html getAvatarSvg(comment.authorProfileTokenId, 40)}
                </div>
                <span class="font-semibold text-sm group-hover:text-primary">
                    @{comment.authorProfileTokenId.slice(0, 10)}...
                </span>
            </a>
        </div>

        <div class="flex items-center gap-3 text-xs text-muted-foreground">
            <span
                class="flex-shrink-0"
                title={new Date(comment.timestamp).toLocaleString()}
            >
                {#if comment.posting}
                    <a
                        href={`${web_explorer_uri_tx}${comment.tx}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        class="underline hover:text-primary"
                    >
                        Posting...
                    </a>
                {:else}
                    {new Date(comment.timestamp).toLocaleString()}
                {/if}
            </span>
            <a
                class="flex items-center text-xs text-muted-foreground gap-1 cursor-pointer hover:text-primary"
                href={$web_explorer_uri_tx + comment.tx}
                target="_blank"
                rel="noopener noreferrer"
                title="Ver Transacción (TX ID)"
            >
                TX: #{comment.tx.slice(0, 6)}...
            </a>

            <span title="ID del Comentario (Box ID)">
                Box: #{comment.id.slice(0, 6)}...
            </span>
        </div>
    </div>

    {#if true && parentComment}
        <blockquote
            class="mb-3 border-l-2 border-border pl-3 text-sm text-muted-foreground italic"
        >
            <a href="#comment-{_parentId}" class="hover:underline">
                Respondiendo a @{parentComment.authorProfileTokenId.slice(
                    0,
                    10,
                )}...
            </a>
            <p class="mt-1">
                "{parentComment.text.slice(0, 75)}{parentComment.text.length >
                75
                    ? "..."
                    : ""}"
            </p>
        </blockquote>
    {/if}

    <div class="text-base mb-3 leading-relaxed text-foreground/90 break-words">
        {@html comment.text.replace(/\n/g, "<br>")}
    </div>

    <div class="flex justify-between items-center flex-wrap gap-x-4 gap-y-2">
        <div class="flex items-center gap-4">
            <Button
                variant="ghost"
                size="sm"
                on:click={() => (showReplyForm = !showReplyForm)}
                disabled={!profile}
            >
                <Reply class="w-4 h-4 mr-1" />
                {showReplyForm ? "Cancelar" : "Responder"}
            </Button>
            {#if !comment.isSpam}
                <Button
                    variant="ghost"
                    size="sm"
                    class="text-red-500"
                    on:click={handleFlag}
                    disabled={isFlagging || !profile}
                >
                    {isFlagging ? "Flagging..." : "Marcar Spam"}
                </Button>
            {:else}
                <span class="text-xs text-muted-foreground italic"
                    >Marcado como Spam</span
                >
            {/if}
        </div>

        <div class="flex items-center gap-4">
            <div class="flex items-center gap-2">
                {#if comment.sentiment === true}
                    <ThumbsUp class="h-4 w-4 text-green-500" />
                {:else if comment.sentiment === false}
                    <ThumbsDown class="h-4 w-4 text-red-500" />
                {/if}
                <span
                    class="text-sm font-medium"
                    class:text-green-600={getScore(comment) > 0}
                    class:text-red-600={getScore(comment) < 0}
                    class:text-gray-500={getScore(comment) === 0}
                >
                    {getScore(comment)}
                </span>
            </div>

            {#if repliesMap[comment.id] && repliesMap[comment.id].length > 0}
                <span class="text-xs text-muted-foreground">
                    Respuestas ({repliesMap[comment.id].length}):
                    {#each repliesMap[comment.id].slice(0, 3) as replyId}
                        <a
                            href="#comment-{replyId}"
                            class="ml-1 hover:text-primary underline"
                        >
                            #{replyId.slice(0, 6)}...
                        </a>
                    {/each}
                </span>
            {/if}
        </div>
    </div>

    {#if commentError}
        <p class="text-red-500 text-sm mt-2">{commentError}</p>
    {/if}

    {#if showReplyForm}
        <form on:submit|preventDefault={handleReply} class="space-y-3 mt-4">
            <Label for="reply-{comment.id}" class="sr-only">Your Reply</Label>
            <Textarea
                id="reply-{comment.id}"
                bind:value={replyText}
                placeholder="Write your reply..."
                rows={3}
                required
            />
            <div class="flex gap-2">
                <Button
                    variant={replySentiment === true ? "default" : "outline"}
                    size="icon"
                    on:click={() => (replySentiment = true)}
                    ><ThumbsUp /></Button
                >
                <Button
                    variant={replySentiment === false ? "default" : "outline"}
                    size="icon"
                    on:click={() => (replySentiment = false)}
                    ><ThumbsDown /></Button
                >
                <Button
                    type="submit"
                    size="sm"
                    disabled={isReplying ||
                        !replyText.trim() ||
                        replySentiment === null}
                >
                    {isReplying ? "Sending..." : "Send Reply"}
                </Button>
            </div>
        </form>
    {/if}
</div>

<style lang="postcss">
    .replies-container {
        /* Se mantiene el estilo de indentación para la vista anidada */
        @apply pl-6 border-l-2 border-border;
    }
</style>
