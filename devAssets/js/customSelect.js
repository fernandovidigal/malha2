function closeAllCheckboxes(selectBoxesDropList, selectBoxes){
    for(let i = 0; i < selectBoxesDropList.length; i++){
        selectBoxes[i].classList.remove("customSelect__header-open");
        selectBoxesDropList[i].classList.remove("customSelect__list-open");
    }
}

// SELECTBOXES
const selectBoxes = document.querySelectorAll('.customSelect__header');
const selectBoxesDropList = document.querySelectorAll('.customSelect__list');
selectBoxes.forEach((selectBox, index) => {
    selectBox.addEventListener('click', function(e){
        e.stopPropagation();

        if(selectBoxesDropList[index].classList.contains('customSelect__list-open')){
            this.classList.remove("customSelect__header-open");
            selectBoxesDropList[index].classList.remove('customSelect__list-open');
        } else {
            closeAllCheckboxes(selectBoxesDropList, selectBoxes);
            this.classList.add("customSelect__header-open");
            const headerSelectDimensions = this.getBoundingClientRect();
            const windowHeight = window.innerHeight;
            selectBoxesDropList[index].classList.add('customSelect__list-open');
            const listSelectDimensions = selectBoxesDropList[index].getBoundingClientRect();

            if(windowHeight - listSelectDimensions.top < listSelectDimensions.height){
                selectBoxesDropList[index].style.top = ((listSelectDimensions.height + 7) * -1) + 'px';
            }
        }
    });
});

document.addEventListener('click', function(){
    closeAllCheckboxes(selectBoxesDropList, selectBoxes);
});