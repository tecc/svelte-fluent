import type { FluentVariable } from '@fluent/bundle';
import { JSDOM } from 'jsdom';
import Overlay from './Overlay.svelte';
import { translateElement } from './utils.js';
import { getInternalFluentContext } from './context.svelte';

type Props = {
	id: string;
	args?: Record<string, FluentVariable>;
};

type Payload = {
	head: {
		out: string[];
		title: string;
	};
	out: string[];
	[x: string]: unknown;
};

function OverlaySSR($$payload: Payload, $$props: Props) {
	const savedOut = $$payload.out;
	const savedHeadOut = $$payload.head.out;
	$$payload.out = [];
	$$payload.head.out = [];
	// @ts-expect-error Overlay is resolved to the non-SSR type
	const res = Overlay($$payload, $$props);
	const { id, args } = $$props;
	const { getTranslation } = getInternalFluentContext();
	const translation = getTranslation(id, args, true);
	const headFragment = JSDOM.fragment($$payload.head.out.join(''));
	const bodyFragment = JSDOM.fragment($$payload.out.join(''));
	const templateNode = headFragment.firstElementChild as HTMLTemplateElement | null;
	const rootNode = bodyFragment.firstElementChild as HTMLElement | null;
	if (templateNode && rootNode && translation) {
		rootNode.innerHTML = '';
		rootNode.appendChild(templateNode.content.cloneNode(true));
		translateElement(rootNode, translation);
		$$payload.out = [rootNode.outerHTML];
	}
	$$payload.out = savedOut.concat($$payload.out);
	$$payload.head.out = savedHeadOut.concat($$payload.head.out);
	return res;
}

export default OverlaySSR;
