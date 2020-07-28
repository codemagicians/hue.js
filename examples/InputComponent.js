class InputComponent extends ComponentBase { constructor() { super({
    selector: 'myInput',
    template: `
        <div class="purple">
            <p [class]="className">[[label]]</p>
            <input (click)="inputClicked('something')" placeholder="myInput">
        </div>
        `,
    style: `
        .purple {
            color:purple;
        }
        .label {
            color: red;
        }
    `,
    script: {
        props: {
            className: '',
            firstName: ''
        },
        data: {
            label: 'Test label. It should be purple if Hue uses scoped class \'label\' it is green in global styles',
            msg: 'hello ',
            text: 'click me'
        },
        inputClicked(data) {
            alert('This works because Hue supports standard dom events, this event handler has got this data: ' + data);
        }
    }
});
}}