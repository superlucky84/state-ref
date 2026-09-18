<script setup lang="ts">
import { watch as vueWatch } from 'vue';
import { useBoardRef, renders, boardRef } from '../store/boardStore';

const titleRef = useBoardRef<string>(stateRef => stateRef.title);
const tagRef = useBoardRef<string>(stateRef => stateRef.meta.tag);
const itemsRef = useBoardRef<number[]>(stateRef => stateRef.items);
const lengthRef = useBoardRef<number>(stateRef => stateRef.items.length);

vueWatch(titleRef, () => (renders.title += 1));
vueWatch(tagRef, () => (renders.tag += 1));
vueWatch(itemsRef, () => (renders.list += 1));

/** Writes made from inside the component, the way the rest of the suite does. */
const changeTag = () => (boardRef.meta.tag.value = 'b');
const growItems = () => (boardRef.items[3].value = 4);
const replaceItems = () => (boardRef.items.value = [...boardRef.items.value, 9]);
const changeTitle = () => (boardRef.title.value = 'elsewhere');
</script>

<template>
  <div>
    <div data-testid="board-title">{{ titleRef.value }}</div>
    <div data-testid="board-tag">{{ tagRef.value }}</div>
    <div data-testid="board-length">{{ lengthRef.value }}</div>
    <ul data-testid="board-list">
      <li v-for="item in itemsRef.value" :key="item">{{ item }}</li>
    </ul>
    <button data-testid="change-tag" @click="changeTag">tag</button>
    <button data-testid="grow-items" @click="growItems">grow</button>
    <button data-testid="replace-items" @click="replaceItems">replace</button>
    <button data-testid="change-title" @click="changeTitle">title</button>
  </div>
</template>
