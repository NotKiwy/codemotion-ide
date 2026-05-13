export let inputs = document.querySelectorAll("input")
export let submitBtn = document.querySelector(".form-submit")
export let usernameInput = document.querySelector("#username")
export let passwordInput = document.querySelector("#password")
export let errorBlock = document.querySelector(".user-form__error")

let submitBtnOriginText = submitBtn.textContent
let loadingHTML = `
<l-line-spinner
    size="20"
    stroke="2"
    speed="1"
    color="white"
></l-line-spinner>
`

export function showLoading() {
    submitBtn.innerHTML = loadingHTML
    
    if(submitBtn.querySelector("l-line-spinner")) {
        submitBtn.querySelector("l-line-spinner").classList.add("hidden")

        setTimeout(() => {
            submitBtn.querySelector("l-line-spinner").classList.remove("hidden")
            submitBtn.querySelector("l-line-spinner").classList.add("animate-appearance")
        }, 200)
    }
}

export function hideLoading() {
    if(submitBtn.querySelector("l-line-spinner")) {
        submitBtn.querySelector("l-line-spinner").classList.add("hidden")
        submitBtn.querySelector("l-line-spinner").addEventListener("transitionend", () => {
            submitBtn.textContent = submitBtnOriginText
        })
    }
}

export function disableButtons() {
    usernameInput.parentElement.setAttribute("disabled", true)
    passwordInput.parentElement.setAttribute("disabled", true)
}
export function unDisableButtons() {
    usernameInput.parentElement.removeAttribute("disabled")
    passwordInput.parentElement.removeAttribute("disabled")
}

export function showErrBlock(text, time = 5000) {
    errorBlock.classList.remove("hidden")
    errorBlock.innerText = text
    errorBlock.addEventListener("transitionend", () => {
        setTimeout(() => {
            errorBlock.classList.add("hidden")
        }, time)
    })
    submitBtn.textContent = submitBtnOriginText
}

window.electron.onAuthMsg((data) => {
    const content = data.content
    const type = data.type

    if(type == "err") {
        showErrBlock(content)
    }
})