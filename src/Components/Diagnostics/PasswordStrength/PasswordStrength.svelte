<script>
    import Shell from '../../Misc/Shell.svelte';
    import Range from '../../Misc/Range.svelte';

    // Strength, length, 
    let password = '', strength = 0, length = 0;
    let strengthColor = 'bg-gray-200';
    let lengthColor = 'bg-gray-200';
    const specialCharacters = ['!','@','#','$','%','^','&','*','(',')','{','}','[',']',';',':','\'','\"','\\','|',',','.','<','>','?','/'];

    const checkPassword = () => {
        // test for length
        if (password.length <= 4) length = 25, lengthColor = 'bg-red-600';
        else if (password.length <= 6) length = 50, lengthColor = 'bg-orange'; 
        else if (password.length <= 8) length = 75, lengthColor = 'bg-yellow-400'; 
        else length = 100, lengthColor = 'bg-green-600';
        
        // test for strength
        strength = 0;

        // test for lowercase 
        if ((/[a-z]+/g).test(password)) strength += 1;
        // test for uppercase
        if ((/[A-Z]+/g).test(password)) strength += 1;
        // test for numbers
        if ((/[0-9]+/g).test(password)) strength += 1;
        // test for specialCharacters
        if (specialCharacters.some(item =>password.includes(item))) strength += 1;
        
        switch (strength) {
            case 0: strength = 25;
                    strengthColor = 'bg-red-600';
                    break;
            case 1: strength = 25;
                    strengthColor = 'bg-red-600';
                    break;
            case 2: strength = 50;
                    strengthColor = 'bg-orange';
                    break;
            case 3: strength = 75;
                    strengthColor = 'bg-yellow-400';
                    break;
            case 4: strength = 100;
                    strengthColor = 'bg-green-600';
                    break;
        }
    }
</script>

<Shell title={"PASSWORD STRENGTH CHECKER"} tooltip={"Get detailed analysis of passwords"}>
    <div class="text-gray-50">
        <div class="flex flex-row">
            <input class="text-black" type="text" bind:value={password} maxlength={32} placeholder="Enter Password" />
            <button on:click={checkPassword} type="submit">Check</button>
        </div>
        <div>
            <!-- Color and length -->
            <div class="flex flex-row items-center">
                <!-- Strength -->
                <span>Strength</span>
                <Range color={strengthColor} length={strength} />
            </div>
            <div class="flex flex-row items-center">
                <!-- Length -->
                <span>Length</span>
                <Range color={lengthColor} length={length} />
            </div>
        </div>
        <div>
            <div class="flex flex-row items-center">
                <div class="w-8 h-2 mr-2 bg-red-600"></div>
                <span>Too Weak</span>
            </div>
            <div class="flex flex-row items-center">
                <div class="w-8 h-2 mr-2" style="background-color: orangered;"></div>
                <span>Weak</span>
            </div>
            <div class="flex flex-row items-center">
                <div class="w-8 h-2 mr-2 bg-yellow-400"></div>
                <span>Medium</span>
            </div>
            <div class="flex flex-row items-center">
                <div class="w-8 h-2 mr-2 bg-green-600"></div>
                <span>Strong</span>
            </div>
        </div>
    </div>
</Shell>
