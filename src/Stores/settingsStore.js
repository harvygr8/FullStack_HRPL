//Svelte
import { writable } from "svelte/store";
import { v4 as uuidv4 } from 'uuid';

//Export
export const settings = writable({
    username: localStorage.username ? localStorage.username : 'Neuron',
    id: localStorage.id ? localStorage.id : uuidv4(),
    bgColor1 : localStorage.bgColor1 ? localStorage.bgColor1 : '#1F2937',
    bgColor2 : localStorage.bgColor2 ? localStorage.bgColor2 : '#111827',
    bgColor3 : localStorage.bgColor3 ? localStorage.bgColor3 : '#374151',
    bgColor4 : localStorage.bgColor4 ? localStorage.bgColor4 : '#a855f7',
    fontColor1 : localStorage.fontColor1 ? localStorage.fontColor1 : '#ffffff',
    fontColor2 : localStorage.fontColor2 ? localStorage.fontColor2 : '#f0f0f0',
    fontColor3 : localStorage.fontColor2 ? localStorage.fontColor2 : '#f0f0f0',
    fontColor4 : localStorage.fontColor2 ? localStorage.fontColor2 : '#f0f0f0',
    shellColor : localStorage.linkColor ? localStorage.shellColor : '#374151',
    linkColor : localStorage.linkColor ? localStorage.linkColor : '#374151',
    miscColor : localStorage.miscColor ? localStorage.miscColor : '#8B5CF6',
    font : localStorage.font ? localStorage.font : ''
});
