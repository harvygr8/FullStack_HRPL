<script>

    //Svelte
    import Shell from '../../Misc/Shell.svelte';
    import Range from '../../Misc/Range.svelte';

    // Strength, length,
    let password = '', strength = 0, length = 0;
    let strengthColor = 'text-gray-200';
    let lengthColor = 'text-gray-200';
    const specialCharacters = ['!','@','#','$','%','^','&','*','(',')','{','}','[',']',';',':','\'','\"','\\','|',',','.','<','>','?','/'];

    const checkPassword = () => {
        // test for length
        if (password.length <= 4) length = 25, lengthColor = 'text-red-600';
        else if (password.length <= 6) length = 50, lengthColor = 'text-orange';
        else if (password.length <= 8) length = 75, lengthColor = 'text-yellow-400';
        else length = 100, lengthColor = 'text-green-600';

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
                    strengthColor = 'text-red-600';
                    break;
            case 1: strength = 25;
                    strengthColor = 'text-red-600';
                    break;
            case 2: strength = 50;
                    strengthColor = 'text-yellow-600';
                    break;
            case 3: strength = 75;
                    strengthColor = 'text-yellow-400';
                    break;
            case 4: strength = 100;
                    strengthColor = 'text-green-600';
                    break;
        }
    }
</script>

<Shell title={"PASSWORD STRENGTH CHECKER"} tooltip={"Get detailed analysis of passwords"}>
    <div class="text-gray-50">
        <div class="flex flex-row">
          <input 
            type="text" 
            placeholder="Enter Password" 
            bind:value={password} 
            class="w-10/12 rounded-md m-2 px-1 text-gray-800 font-bold" 
            required
            maxlength={32}
          >
          <button 
            type="button" 
            on:click={checkPassword}  
            class="text-sm bg-purple-500 px-2 py-1 m-2 rounded-md mx-1 font-thin hover:bg-purple-600"
          >
            CHECK
        </button>
            <!-- <input class="text-black" type="text" bind:value={password} maxlength={32} placeholder="Enter Password" />
            <button on:click={checkPassword} type="submit">Check</button> -->
        </div>
        <div>
            <!-- Color and length -->
            <div class="flex flex-row justify-center">

            <div class='p-4 m-2 flex flex-col justify-center items-center'>
              <p class='text-white font-thin text-lg text-2xl'>Strength</p>
                <div class='flex flex-row'>
                  <p id="infoValueCPN" class='font-bold text-white text-3xl {strengthColor}'>{strength} %</p>&nbsp
                </div>
            </div>

            <div class='p-4 m-2 flex flex-col justify-center items-center'>
              <p class='text-white font-thin text-lg text-2xl'>Length</p>
                <div class='flex flex-row'>
                  <p id="infoValueCPN" class='font-bold text-white text-3xl {lengthColor}' style="text-transform: uppercase;">{password.length}</p>&nbsp
                </div>
            </div>

            </div>

                <!-- Strength -->

        <!-- <div class="flex flex-row justify-center items-start">
        <div class="flex flex-col items-center mt-4 ml-12 mr-12">
            <div class="w-12 rounded h-4 bg-red-600"></div>
            <span>Poor</span>
        </div>
        <div class="flex flex-col items-center mt-4 mr-12">
            <div class="w-12 rounded h-4 bg-yellow-600"></div>
            <span>Weak</span>
        </div>
            <div class="flex flex-col items-center mt-4 mr-12">
                <div class="w-12 rounded h-4 bg-yellow-400"></div>
                <span>Medium</span>
            </div>
            <div class="flex flex-col items-center mt-4 mr-12">
                <div class="w-12 rounded h-4 bg-green-600"></div>
                <span>Strong</span>
            </div>
        </div> -->
    </div>
</Shell>
