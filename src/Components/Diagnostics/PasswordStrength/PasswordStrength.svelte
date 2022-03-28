<script>
    //Svelte
    import Shell from '../../Misc/Shell.svelte';
    
    // Strength, length,
    let password = '', strength = 0, length = 0;
    let strengthColor = 'text-gray-200';
    let lengthColor = 'text-gray-200';
    const specialCharacters = ['!','@','#','$','%','^','&','*','(',')','{','}','[',']',';',':','\'','\"','\\','|',',','.','<','>','?','/'];

    const checkPassword = () => {
        // test for length
        if (password.length <= 4) length = 25, lengthColor = 'text-red-600';
        else if (password.length <= 6) length = 50, lengthColor = 'text-yellow-600';
        else if (password.length <= 8) length = 75, lengthColor = 'text-yellow-300';
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
            case 0: strength = 0;
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

<Shell title={"Password Checker"} tooltip={"Get detailed analysis of passwords"}>
    <div class="text-gray-50">
        <div class="flex flex-row">
          <input
            type="text"
            placeholder="Enter Password"
            bind:value={password}
            class="w-full rounded-md m-2 px-1 text-gray-800 font-semibold"
            required
            on:keyup={checkPassword}
            maxlength={32}
          >
        
        </div>
        <div class="grid grid-cols-2 gap-x-2 mt-2">
            <!-- Strength and length -->
            <div class="flex flex-col justify-start items-center">
              <span>Strength</span>
              <p class="font-semibold text-xl {strengthColor}">
                {strength} %
              </p>
            </div>
            <div class="flex flex-col justify-start items-center">
              <span>Length</span>
              <p class="font-semibold text-xl {lengthColor}">
              {password.length} s
              </p>
            </div>
          </div>
    </div>
</Shell>
