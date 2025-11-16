<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.ico';
	import ToastHost from '$lib/components/ToastHost.svelte';
	import { setContext } from 'svelte';
	import { WORKSPACE_TIMEZONE_CONTEXT } from '$lib/context/workspace-timezone';
	
	let { children, data } = $props();
	const workspaceTimezone = data.workspaceTimezone ?? 'UTC';
	setContext(WORKSPACE_TIMEZONE_CONTEXT, workspaceTimezone);
</script>

<svelte:head>
	<title>SimpleDesk</title>
	<meta
		name="description"
		content="Organize your work with simple task lists and notes, all in one minimalist dashboard."
	/>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="relative">
	{@render children()}
	<ToastHost />
</div>
