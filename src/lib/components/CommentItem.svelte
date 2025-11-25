<script lang="ts">
    import { Button } from "$lib/components/ui/button/index.js";
    import { Textarea } from "$lib/components/ui/textarea";
    import { Label } from "$lib/components/ui/label/index.js";
    import { ThumbsUp, ThumbsDown } from "lucide-svelte";
    import { web_explorer_uri_tx } from "$lib/ergo/envs";
    import { getScore, type Comment } from "$lib/ergo/commentObject";
    import { replyToComment, flagSpam } from "$lib/ergo/commentStore";
    import { viewMode } from "$lib/ergo/store";
    import * as jdenticon from "jdenticon";
    import type { ReputationProof } from "$lib/ergo/object";

    export let comment: Comment;
    export let profile: ReputationProof | null = null;
    export let showAllComments = false;
    export let topic_id: string;
    export let connect_executed = false;
    export let _parentId: string | undefined = undefined;
    export let allCommentsFlatProfilesMap: Record<string, string> = {};

    let replyText = "";
    let isReplying = false;
    let isFlagging = false;
    let commentError: string | null = null;
    let showReplyForm = false;
    let replySentiment: boolean | null = null;

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

<div
    class="comment-container"
    class:border={$viewMode === "nested"}
    class:rounded-md={$viewMode === "nested"}
    class:p-4={$viewMode === "nested"}
    class:bg-card={$viewMode === "nested"}
    id="comment-{comment.id}"
>
    <div class="flex justify-between items-center mb-2">
        <div class="flex items-center gap-2">
            <div class="avatar w-10 h-10 rounded-full overflow-hidden">
                {@html getAvatarSvg(comment.authorProfileTokenId, 40)}
            </div>

            <span class="font-semibold text-sm"
                >@{comment.authorProfileTokenId.slice(0, 6)}</span
            >

            <a
                class="flex items-center text-xs text-muted-foreground gap-1 cursor-pointer"
                style="margin-right: 2rem;"
                href={web_explorer_uri_tx + comment.tx}
                target="_blank"
                rel="noopener noreferrer"
            >
                #{comment.id.slice(0, 6)}
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="w-3 h-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M14 3h7v7m0-7L10 14m-4 0H3v-7a2 2 0 012-2h7z"
                    />
                </svg>
            </a>

            {#if $viewMode === "nested"}
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
            {/if}
        </div>

        <div class="flex items-center gap-3 text-xs text-muted-foreground">
            {#if $viewMode === "forum" && _parentId}
                <span class="flex items-center gap-1">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        class="lucide lucide-reply"
                        ><polyline points="9 17 4 12 9 7" /><path
                            d="M20 18v-2a4 4 0 0 0-4-4H4"
                        /></svg
                    >
                    <!-- svelte-ignore a11y-missing-attribute -->
                    <a class="hover:text-primary">
                        {#if allCommentsFlatProfilesMap && allCommentsFlatProfilesMap[_parentId]}
                            <span class="font-semibold"
                                >@{allCommentsFlatProfilesMap[_parentId].slice(
                                    0,
                                    6,
                                )}</span
                            >
                        {/if}

                        <span class="ml-1 opacity-80"
                            >#{_parentId.slice(0, 6)}</span
                        >
                    </a>
                </span>
            {/if}

            <span class="flex-shrink-0">
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
        </div>
    </div>

    <p class="text-base mb-3">
        {@html comment.text.replace(/\n/g, "<br>")}
    </p>

    <div class="flex justify-between items-center flex-wrap gap-x-4 gap-y-2">
        <div class="flex items-center gap-4">
            <Button
                variant="ghost"
                size="sm"
                on:click={() => (showReplyForm = !showReplyForm)}
                disabled={!profile}
            >
                {showReplyForm ? "Cancel" : "Reply"}
            </Button>
            {#if !comment.isSpam}
                <Button
                    variant="ghost"
                    size="sm"
                    class="text-red-500"
                    on:click={handleFlag}
                    disabled={isFlagging || !profile}
                >
                    {isFlagging ? "Flagging..." : "Mark Spam"}
                </Button>
            {:else}
                <span class="text-xs text-muted-foreground">Spam</span>
            {/if}
        </div>

        {#if $viewMode === "forum"}
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
        {/if}
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

    {#if $viewMode === "nested"}
        {#if comment.replies && comment.replies.length > 0}
            <div class="replies-container mt-4 space-y-4">
                {#each comment.replies as reply (reply.id)}
                    {#if showAllComments || !reply.isSpam}
                        <svelte:self
                            comment={reply}
                            {showAllComments}
                            {topic_id}
                            {connect_executed}
                            {profile}
                            {allCommentsFlatProfilesMap}
                        />
                    {/if}
                {/each}
            </div>
        {/if}
    {/if}
</div>

<style lang="postcss">
    .replies-container {
        @apply pl-6 border-l-2 border-border;
    }
</style>
