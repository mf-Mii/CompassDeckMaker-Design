window.addEventListener('DOMContentLoaded', function () {
    //イベントリスナーを登録
    $('.iconBtn,.deckList-button').on('click', function () {
        onButtonAction($(this));
    });
});

//Event Handlers
function onButtonAction(button) {
    console.log('Fire ButtonAction')
    if (button.attr('id') === 'LeftDecksEditModeOnBtn__') {
        $("#deckList").addClass("editMode");
        $("#deckList").addClass("editMode");
        button.addClass("hide");
        $("#LeftDecksEditModeOffBtn__").removeClass("hide");
    } else if (button.attr('id') === 'LeftDecksEditModeOffBtn__') { 
        $("#deckList").removeClass("editMode");
        $("#deckList").removeClass("editMode");
        button.addClass("hide");
        $("#LeftDecksEditModeOnBtn__").removeClass("hide");
    } else if (button.hasClass('deckList-editBtn')) {
        button.parents('li.deckList-item').find('input.deckList-nameInput').first().val(button.parents('li.deckList-item').find('.deckList-name').first().text())
        button.parents('li.deckList-item').addClass('editing');
    }
}

