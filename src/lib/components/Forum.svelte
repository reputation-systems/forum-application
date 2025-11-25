<script lang="ts">
    import { tick } from "svelte";
    import { Button } from "$lib/components/ui/button/index.js";
    import { Input } from "$lib/components/ui/input/index.js";
    import { Textarea } from "$lib/components/ui/textarea";
    import { Label } from "$lib/components/ui/label/index.js";
    import { ThumbsUp, ThumbsDown } from "lucide-svelte";
    import {
        threads,
        isLoading,
        error,
        currentProjectId as currentTopicId,
        loadThreads,
        postComment,
    } from "$lib/ergo/commentStore";
    import { viewMode } from "$lib/ergo/store";
    import { type Comment } from "$lib/ergo/commentObject";
    import type { ReputationProof } from "$lib/ergo/object";
    import CommentItem from "./CommentItem.svelte";
    import { get } from "svelte/store";

    export let topic_id: string;
    export let profile: ReputationProof | null = null;
    export let connect_executed = false;

    let newCommentText = "";
    let isPostingComment = false;
    let sentiment: boolean | null = null;
    export let showAllComments = false;

    type FlatComment = Comment & { _parentId?: string };

    function flattenComments(
        comments: Comment[],
        parentId: string | undefined = undefined,
    ): FlatComment[] {
        return comments.reduce((acc, comment) => {
            const flatComment: FlatComment = {
                ...comment,
                _parentId: parentId,
            };
            acc.push(flatComment);
            if (comment.replies) {
                acc.push(...flattenComments(comment.replies, comment.id));
            }
            return acc;
        }, [] as FlatComment[]);
    }

    $: allCommentsFlat = flattenComments($threads).sort(
        (a, b) => a.timestamp - b.timestamp,
    );
    $: allCommentsFlatProfilesMap = allCommentsFlat.reduce(
        (acc, comment) => {
            acc[comment.id] = comment.authorProfileTokenId;
            return acc;
        },
        {} as Record<string, string>,
    );

    async function handleLoadThreads() {
        try {
            currentTopicId.set(topic_id);
            await loadThreads();
        } catch (err) {
            console.error("Error loading threads for topic:", err);
        }
    }

    async function handleToggleShowAll(e: Event) {
        const input = e.target as HTMLInputElement;
        showAllComments = input.checked;
        await tick();
        try {
            await loadThreads();
        } catch (err) {
            console.error(
                "Failed to reload threads after toggling showAllComments:",
                err,
            );
        }
    }

    async function handlePostComment() {
        if (!newCommentText.trim() || sentiment === null) return;
        isPostingComment = true;
        await postComment(newCommentText, sentiment);
        newCommentText = "";
        sentiment = null;
        isPostingComment = false;
    }

    // Load threads when topic_id changes or on mount if not loaded
    $: if (topic_id) {
        // We can trigger load here or let the parent do it.
        // App.svelte did: currentTopicId.subscribe... loadThreads()
        // We'll expose a manual load button as well.
        if (get(currentTopicId) !== topic_id) {
            currentTopicId.set(topic_id);
            loadThreads();
        }
    }
</script>

<div
    class="mb-8 flex items-end gap-3 mt-8 p-6 bg-card border border-border rounded-xl shadow-sm"
>
    <div class="flex-1 space-y-2">
        <Label for="topic-id-input" class="text-base font-semibold"
            >Topic ID</Label
        >
        <Input
            type="text"
            id="topic-id-input"
            bind:value={topic_id}
            placeholder="Enter Topic/Project/Discussion ID"
            class="font-mono"
        />
    </div>
    <Button on:click={handleLoadThreads} class="mb-[2px]">Load</Button>
</div>

<h1 class="text-3xl font-bold mb-6">Comments</h1>

<form on:submit|preventDefault={handlePostComment} class="space-y-4 mb-8">
    <div>
        <Label for="newComment">Your Comment</Label>
        <Textarea
            id="newComment"
            bind:value={newCommentText}
            placeholder="Write your comment..."
            rows={4}
            required
        />
    </div>
    <div class="flex gap-4 items-center">
        <Button
            variant={sentiment === true ? "default" : "outline"}
            size="icon"
            on:click={() => (sentiment = true)}><ThumbsUp /></Button
        >
        <Button
            variant={sentiment === false ? "default" : "outline"}
            size="icon"
            on:click={() => (sentiment = false)}><ThumbsDown /></Button
        >
        <Button
            type="submit"
            disabled={isPostingComment || !newCommentText.trim() || !profile}
        >
            {isPostingComment ? "Posting..." : "Post Comment"}
        </Button>
    </div>
</form>

<div class="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
    <div class="flex items-center">
        <input
            id="showAll"
            type="checkbox"
            checked={showAllComments}
            on:change={handleToggleShowAll}
            class="mr-2"
        />
        <Label for="showAll">Show all comments (including spam)</Label>
    </div>

    <div class="flex items-center">
        <input
            id="forumView"
            type="checkbox"
            on:change={() =>
                ($viewMode = $viewMode === "nested" ? "forum" : "nested")}
            checked={$viewMode === "forum"}
            class="mr-2"
        />
        <Label for="forumView">Forum view</Label>
    </div>
</div>

{#if $isLoading}
    <p class="text-muted-foreground">Loading comments...</p>
{:else if $error}
    <div
        class="p-4 bg-red-100 dark:bg-red-900 border border-red-400 rounded-md text-red-800 dark:text-red-200"
    >
        {$error}
    </div>
{:else if $threads.length === 0}
    <p class="text-muted-foreground text-center py-4">
        No comments yet. Be the first!
    </p>
{:else if $viewMode === "nested"}
    <div class="space-y-6">
        {#each $threads as thread (thread.id)}
            {#if showAllComments || !thread.isSpam}
                <CommentItem
                    comment={thread}
                    {showAllComments}
                    {topic_id}
                    {connect_executed}
                    {profile}
                    {allCommentsFlatProfilesMap}
                />
            {/if}
        {/each}
    </div>
{:else}
    <div class="forum-container flex flex-col">
        {#each allCommentsFlat as flatComment (flatComment.id)}
            {#if showAllComments || !flatComment.isSpam}
                <div
                    class="forum-comment-wrapper border-t border-border first:border-t-0 py-4"
                >
                    <CommentItem
                        comment={flatComment}
                        _parentId={flatComment._parentId}
                        {showAllComments}
                        {topic_id}
                        {connect_executed}
                        {profile}
                        {allCommentsFlatProfilesMap}
                    />
                </div>
            {/if}
        {/each}
    </div>
{/if}
