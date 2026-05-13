import {
    inputs,
    submitBtn,
    usernameInput,
    passwordInput,
    errorBlock,
    showLoading,
    hideLoading,
    disableButtons,
    unDisableButtons,
    showErrBlock
} from "../components/authRenderer.js"

if (inputs.length > 0) {
    inputs.forEach(input => {
        input.addEventListener("input", (e) => {
            if (e.target.value.length > 0) {
                input.classList.add("focused")
            }
            else {
                input.classList.remove("focused")
            }
        })
    })
}

submitBtn.addEventListener("click", async () => {
    let confirmPasswordInput = document.querySelector("#confirm_password")

    let username = usernameInput.value
    let password = passwordInput.value
    let confirmPassword = confirmPasswordInput.value

    showLoading()
    disableButtons()

    let res = await window.electron.register(username, password, confirmPassword)
    console.log(res)

    if(res.success) {
        errorBlock.classList.add("hidden")
        window.location.href = `login.html?username=${username}&password=${password}`
    }
    else {
        showErrBlock(res.result)
    }

    unDisableButtons()
    hideLoading()
})