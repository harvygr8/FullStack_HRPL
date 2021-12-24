import { writable } from "svelte/store";

export const settings = writable({
    username: localStorage.username ? localStorage.username : 'User',
    bgColor1 : localStorage.bgColor1 ? localStorage.bgColor1 : '#111827',
    bgColor2 : localStorage.bgColor2 ? localStorage.bgColor2 : '#3C0A64',
    fontColor1 : localStorage.fontColor1 ? localStorage.fontColor1 : '#ffffff',
    fontColor2 : localStorage.fontColor1 ? localStorage.fontColor2 : '#f0f0f0',
    font : localStorage.font ? localStorage.font : ''
});