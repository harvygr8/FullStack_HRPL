<script>
    import { settings } from '../../Stores/settingsStore';

    // Props
    export let title = 'Title';
    export let tooltip = 'This is a shell component';

    // Check if component is in storage
    function checkInStorage(component) {
        const favorites = localStorage.favorites;
        // Returns true if pokemon is in localStorage / team
        if (strToArr(favorites).some(item => item === component)) return true;
        // Returns false if pokemon is not present
        else return false;
    }

    // Function to add / remove component from favourites
    function toggleFavourites(e,component) {
        const favorites = localStorage.favorites;
        let elem = e.srcElement;
        elem.classList += "text-yellow-300";
        if (strToArr(favorites).some(item => item === component)) {
            localStorage.favorites = (strToArr(favorites).filter(item => item !== component)).toString();
        }
        // Add component if not present in favorites
        else {
            const newFavorites = strToArr(localStorage.favorites);
            newFavorites.push(component)
            localStorage.favorites = (newFavorites).toString()
        }
    }

    // Helper function
    function strToArr(str) {
    if (!str) return [];
    return str.split(',');
}
</script>

<div
    class="rounded-md shadow-md p-2 "
    style="background-color: {$settings.bgColor3}; color: {$settings.fontColor1}"
>
    <div class="flex flex-row justify-between items-center">
        <h3
            class="text-lg font-semibold"
            style="color: {$settings.fontColor2};"
        >
            {title}
        </h3>
        <div>
            <span
                class="ml-2 fas fa-info-circle cursor-pointer"
                title="{tooltip}"
            />
            <span
                class="ml-2 fas fa-star cursor-pointer {checkInStorage(title) ? 'text-yellow-500' : ''}"
                title="Add to favourites"
                on:click={(e) => toggleFavourites(e,title)}
            />

        </div>
    </div>
    <hr class="my-1 h-px bg-white">
    <div>
        <slot />
    </div>
</div>
