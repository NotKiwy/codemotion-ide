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

const params = new URLSearchParams(window.location.search)

if(params.get("username") != null) {
    usernameInput.value = params.get("username")
    usernameInput.classList.add("focused")
}
if(params.get("password") != null) {
    passwordInput.value = params.get("password")
    passwordInput.classList.add("focused")
}

window.electron.oncb("auth-msg", (data) => {
    const type = data.type

    if(type == "error") {
        showErrBlock(data.content)
    }
})

submitBtn.addEventListener("click", async () => {
    let username = usernameInput.value
    let password = passwordInput.value
    
    showLoading()
    disableButtons()

    let res = await window.electron.login(username, password)
    console.log(res)

    if(res.success) {
        errorBlock.classList.add("hidden")
        await window.electron.reload()
    }
    else {
        showErrBlock(res.result)
    }

    unDisableButtons()
    hideLoading()
})