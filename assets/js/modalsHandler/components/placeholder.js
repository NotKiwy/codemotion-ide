export function renderPlaceholder(properties = {}) {
    const id = properties.id
    const title = properties.title
    const description = properties.description

    const wrapper = document.createElement("div")
    wrapper.classList.add("modal-category__item")
    wrapper.id = id

    const elementTitle = document.createElement("div")
    elementTitle.classList.add("modal-category__item-title")
    elementTitle.textContent = title

    const elementDesc = document.createElement("div")
    elementDesc.classList.add("modal-category__item-desc")
    elementDesc.textContent = description

    if(title) wrapper.appendChild(elementTitle)
    if(description) wrapper.appendChild(elementDesc)

    return wrapper
}